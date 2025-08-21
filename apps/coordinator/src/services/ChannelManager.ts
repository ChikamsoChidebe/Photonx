import { Logger } from 'pino';
import { v4 as uuidv4 } from 'uuid';
import { ethers } from 'ethers';
import Big from 'big.js';

import {
  ChannelId,
  ChannelState,
  ChannelParams,
  ChannelStatus,
  Address,
  TokenAmount,
  QuoteRequest,
  Quote,
  Fill,
  Cancel,
  Replace,
  Heartbeat,
  SettlementRequest,
  CheckpointRequest,
  CONSTANTS,
  createChannelId,
  createAddress,
  createTokenAmount,
  getCurrentTimestamp,
  ChannelError,
  ValidationError
} from '@photonx/proto';

import { DatabaseService } from './DatabaseService';
import { RedisService } from './RedisService';

/**
 * Channel Manager Service
 * 
 * Manages the complete lifecycle of ERC-7824 state channels including:
 * - Channel creation and initialization
 * - State transitions and validation
 * - Nonce management and ordering
 * - Timeout and expiry handling
 * - Channel closure and settlement coordination
 */
export class ChannelManager {
  private logger: Logger;
  private db: DatabaseService;
  private redis: RedisService;

  // In-memory channel cache for fast access
  private channelCache = new Map<string, ChannelState>();
  private channelLocks = new Map<string, Promise<void>>();

  // Channel timeout tracking
  private timeoutTimers = new Map<string, NodeJS.Timeout>();

  // Performance metrics
  private metrics = {
    channelsCreated: 0,
    channelsClosed: 0,
    stateTransitions: 0,
    timeouts: 0,
    errors: 0
  };

  constructor(
    databaseService: DatabaseService,
    redisService: RedisService,
    logger: Logger
  ) {
    this.db = databaseService;
    this.redis = redisService;
    this.logger = logger;

    this.initializeChannelCache();
    this.startPeriodicTasks();
  }

  /**
   * Initialize channel cache from database
   */
  private async initializeChannelCache(): Promise<void> {
    try {
      const activeChannels = await this.db.getCollection('channels').find({
        status: { $in: ['ACTIVE', 'CHECKPOINTING'] }
      }).toArray();

      for (const channel of activeChannels) {
        this.channelCache.set(channel.channelId, this.deserializeChannelState(channel));
        this.setupChannelTimeout(channel.channelId, channel.timeoutAt);
      }

      this.logger.info({ count: activeChannels.length }, 'Channel cache initialized');
    } catch (error) {
      this.logger.error({ error }, 'Failed to initialize channel cache');
      throw error;
    }
  }

  /**
   * Start periodic maintenance tasks
   */
  private startPeriodicTasks(): void {
    // Sync cache with database every 30 seconds
    setInterval(async () => {
      try {
        await this.syncCacheWithDatabase();
      } catch (error) {
        this.logger.error({ error }, 'Cache sync failed');
      }
    }, 30000);

    // Clean up expired channels every 5 minutes
    setInterval(async () => {
      try {
        await this.cleanupExpiredChannels();
      } catch (error) {
        this.logger.error({ error }, 'Channel cleanup failed');
      }
    }, 300000);

    // Update metrics every minute
    setInterval(async () => {
      try {
        await this.updateMetrics();
      } catch (error) {
        this.logger.error({ error }, 'Metrics update failed');
      }
    }, 60000);
  }

  /**
   * Creates a new state channel
   */
  async createChannel(params: ChannelParams): Promise<{
    channelId: ChannelId;
    initialState: ChannelState;
  }> {
    const channelId = createChannelId();
    const startTime = Date.now();

    try {
      this.logger.info({ channelId: channelId.value, params }, 'Creating new channel');

      // Validate parameters
      this.validateChannelParams(params);

      // Create initial state
      const initialState: ChannelState = {
        channelId,
        nonce: 0n,
        trader: params.trader,
        lp: params.lp,
        traderBalances: [createTokenAmount(params.tokenIn.value, params.traderDeposit)],
        lpBalances: [createTokenAmount(params.tokenOut.value, params.lpDeposit)],
        timestamp: getCurrentTimestamp(),
        chainId: params.chainId
      };

      // Store in database
      const channelDoc = {
        channelId: channelId.value,
        ...this.serializeChannelState(initialState),
        status: 'ACTIVE' as ChannelStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
        timeoutAt: new Date(Date.now() + Number(params.timeout) * 1000),
        participants: [params.trader.value, params.lp.value],
        tokens: [params.tokenIn.value, params.tokenOut.value],
        metadata: {
          traderDeposit: params.traderDeposit.toString(),
          lpDeposit: params.lpDeposit.toString(),
          timeout: params.timeout.toString()
        }
      };

      await this.db.getCollection('channels').insertOne(channelDoc);

      // Cache the channel
      this.channelCache.set(channelId.value, initialState);

      // Setup timeout
      this.setupChannelTimeout(channelId.value, channelDoc.timeoutAt);

      // Store in Redis for fast access
      await this.redis.setex(
        `channel:${channelId.value}`,
        3600, // 1 hour TTL
        JSON.stringify(this.serializeChannelState(initialState))
      );

      // Update metrics
      this.metrics.channelsCreated++;
      
      const duration = Date.now() - startTime;
      this.logger.info({ 
        channelId: channelId.value, 
        duration,
        trader: params.trader.value,
        lp: params.lp.value
      }, 'Channel created successfully');

      return { channelId, initialState };

    } catch (error) {
      this.metrics.errors++;
      this.logger.error({ error, channelId: channelId.value }, 'Failed to create channel');
      throw new ChannelError(`Failed to create channel: ${error.message}`);
    }
  }

  /**
   * Gets current channel state
   */
  async getChannelState(channelId: string): Promise<ChannelState | null> {
    try {
      // Check cache first
      const cached = this.channelCache.get(channelId);
      if (cached) {
        return cached;
      }

      // Check Redis
      const redisData = await this.redis.get(`channel:${channelId}`);
      if (redisData) {
        const state = this.deserializeChannelState(JSON.parse(redisData));
        this.channelCache.set(channelId, state);
        return state;
      }

      // Fallback to database
      const channelDoc = await this.db.getCollection('channels').findOne({ channelId });
      if (!channelDoc) {
        return null;
      }

      const state = this.deserializeChannelState(channelDoc);
      this.channelCache.set(channelId, state);

      // Update Redis cache
      await this.redis.setex(
        `channel:${channelId}`,
        3600,
        JSON.stringify(this.serializeChannelState(state))
      );

      return state;

    } catch (error) {
      this.logger.error({ error, channelId }, 'Failed to get channel state');
      throw new ChannelError(`Failed to get channel state: ${error.message}`);
    }
  }

  /**
   * Updates channel state with new message
   */
  async updateChannelState(
    channelId: string,
    newState: ChannelState,
    messageType: string,
    messageData: any
  ): Promise<void> {
    // Use distributed lock to prevent race conditions
    await this.withChannelLock(channelId, async () => {
      try {
        const currentState = await this.getChannelState(channelId);
        if (!currentState) {
          throw new ChannelError(`Channel ${channelId} not found`);
        }

        // Validate state transition
        this.validateStateTransition(currentState, newState, messageType);

        // Update database
        const updateDoc = {
          ...this.serializeChannelState(newState),
          updatedAt: new Date(),
          lastMessageType: messageType,
          lastMessageData: messageData
        };

        await this.db.getCollection('channels').updateOne(
          { channelId },
          { $set: updateDoc }
        );

        // Update cache
        this.channelCache.set(channelId, newState);

        // Update Redis
        await this.redis.setex(
          `channel:${channelId}`,
          3600,
          JSON.stringify(this.serializeChannelState(newState))
        );

        // Store message in history
        await this.storeMessage(channelId, messageType, messageData, newState.nonce);

        this.metrics.stateTransitions++;
        
        this.logger.debug({
          channelId,
          messageType,
          oldNonce: currentState.nonce.toString(),
          newNonce: newState.nonce.toString()
        }, 'Channel state updated');

      } catch (error) {
        this.metrics.errors++;
        this.logger.error({ error, channelId, messageType }, 'Failed to update channel state');
        throw error;
      }
    });
  }

  /**
   * Processes a quote request message
   */
  async processQuoteRequest(request: QuoteRequest): Promise<void> {
    const channelId = request.channelId.value;
    
    try {
      const currentState = await this.getChannelState(channelId);
      if (!currentState) {
        throw new ChannelError(`Channel ${channelId} not found`);
      }

      // Validate request
      this.validateQuoteRequest(request, currentState);

      // Create new state (nonce increment handled by message processor)
      const newState: ChannelState = {
        ...currentState,
        nonce: request.nonce,
        timestamp: request.timestamp
      };

      await this.updateChannelState(channelId, newState, 'QUOTE_REQUEST', request);

      this.logger.debug({
        channelId,
        trader: request.trader.value,
        side: request.side,
        quantity: request.quantity.toString()
      }, 'Quote request processed');

    } catch (error) {
      this.logger.error({ error, channelId }, 'Failed to process quote request');
      throw error;
    }
  }

  /**
   * Processes a fill message
   */
  async processFill(fill: Fill): Promise<ChannelState> {
    const channelId = fill.channelId.value;
    
    try {
      const currentState = await this.getChannelState(channelId);
      if (!currentState) {
        throw new ChannelError(`Channel ${channelId} not found`);
      }

      // Validate fill
      this.validateFill(fill, currentState);

      // Calculate new balances after fill
      const newState = this.calculatePostFillState(currentState, fill);

      await this.updateChannelState(channelId, newState, 'FILL', fill);

      this.logger.info({
        channelId,
        fillId: fill.fillId,
        quantity: fill.quantity.toString(),
        price: fill.price.toString()
      }, 'Fill processed successfully');

      return newState;

    } catch (error) {
      this.logger.error({ error, channelId, fillId: fill.fillId }, 'Failed to process fill');
      throw error;
    }
  }

  /**
   * Processes a cancel message
   */
  async processCancel(cancel: Cancel): Promise<void> {
    const channelId = cancel.channelId.value;
    
    try {
      const currentState = await this.getChannelState(channelId);
      if (!currentState) {
        throw new ChannelError(`Channel ${channelId} not found`);
      }

      // Validate cancel
      this.validateCancel(cancel, currentState);

      const newState: ChannelState = {
        ...currentState,
        nonce: cancel.nonce,
        timestamp: cancel.timestamp
      };

      await this.updateChannelState(channelId, newState, 'CANCEL', cancel);

      // Mark quote as cancelled in database
      await this.db.getCollection('quotes').updateOne(
        { quoteId: cancel.quoteId },
        { $set: { status: 'CANCELLED', cancelledAt: new Date() } }
      );

      this.logger.debug({
        channelId,
        quoteId: cancel.quoteId
      }, 'Cancel processed');

    } catch (error) {
      this.logger.error({ error, channelId }, 'Failed to process cancel');
      throw error;
    }
  }

  /**
   * Processes a heartbeat message
   */
  async processHeartbeat(heartbeat: Heartbeat): Promise<void> {
    const channelId = heartbeat.channelId.value;
    
    try {
      const currentState = await this.getChannelState(channelId);
      if (!currentState) {
        throw new ChannelError(`Channel ${channelId} not found`);
      }

      // Update last activity timestamp
      await this.db.getCollection('channels').updateOne(
        { channelId },
        { 
          $set: { 
            lastHeartbeatAt: new Date(),
            lastActivityAt: new Date()
          } 
        }
      );

      // Update Redis TTL
      await this.redis.expire(`channel:${channelId}`, 3600);

      this.logger.debug({ channelId, sender: heartbeat.sender.value }, 'Heartbeat processed');

    } catch (error) {
      this.logger.error({ error, channelId }, 'Failed to process heartbeat');
      throw error;
    }
  }

  /**
   * Creates a checkpoint for the channel
   */
  async createCheckpoint(request: CheckpointRequest): Promise<void> {
    const channelId = request.channelId.value;
    
    try {
      const currentState = await this.getChannelState(channelId);
      if (!currentState) {
        throw new ChannelError(`Channel ${channelId} not found`);
      }

      // Validate checkpoint request
      this.validateCheckpointRequest(request, currentState);

      // Update channel status to checkpointing
      await this.db.getCollection('channels').updateOne(
        { channelId },
        { 
          $set: { 
            status: 'CHECKPOINTING',
            checkpointAt: new Date(),
            checkpointNonce: request.state.nonce.toString()
          } 
        }
      );

      // Store checkpoint data
      await this.db.getCollection('checkpoints').insertOne({
        channelId,
        nonce: request.state.nonce.toString(),
        stateHash: this.calculateStateHash(request.state),
        state: this.serializeChannelState(request.state),
        traderSignature: request.traderSignature,
        lpSignature: request.lpSignature,
        createdAt: new Date()
      });

      this.logger.info({
        channelId,
        nonce: request.state.nonce.toString()
      }, 'Checkpoint created');

    } catch (error) {
      this.logger.error({ error, channelId }, 'Failed to create checkpoint');
      throw error;
    }
  }

  /**
   * Closes a channel and prepares for settlement
   */
  async closeChannel(channelId: string, finalState: ChannelState): Promise<void> {
    try {
      const currentState = await this.getChannelState(channelId);
      if (!currentState) {
        throw new ChannelError(`Channel ${channelId} not found`);
      }

      // Validate final state
      if (finalState.nonce < currentState.nonce) {
        throw new ValidationError('Final state nonce cannot be lower than current nonce');
      }

      // Update channel status
      await this.db.getCollection('channels').updateOne(
        { channelId },
        { 
          $set: { 
            status: 'SETTLING',
            closedAt: new Date(),
            finalState: this.serializeChannelState(finalState),
            finalNonce: finalState.nonce.toString()
          } 
        }
      );

      // Remove from cache and clear timeout
      this.channelCache.delete(channelId);
      this.clearChannelTimeout(channelId);

      // Remove from Redis
      await this.redis.del(`channel:${channelId}`);

      this.metrics.channelsClosed++;

      this.logger.info({
        channelId,
        finalNonce: finalState.nonce.toString()
      }, 'Channel closed for settlement');

    } catch (error) {
      this.logger.error({ error, channelId }, 'Failed to close channel');
      throw error;
    }
  }

  /**
   * Gets all channels for a user
   */
  async getUserChannels(userAddress: string): Promise<ChannelState[]> {
    try {
      const channels = await this.db.getCollection('channels').find({
        participants: userAddress.toLowerCase(),
        status: { $in: ['ACTIVE', 'CHECKPOINTING'] }
      }).toArray();

      return channels.map(channel => this.deserializeChannelState(channel));

    } catch (error) {
      this.logger.error({ error, userAddress }, 'Failed to get user channels');
      throw error;
    }
  }

  /**
   * Gets channel statistics
   */
  async getChannelStats(): Promise<any> {
    try {
      const stats = await this.db.getCollection('channels').aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalVolume: { $sum: { $toDouble: '$metadata.totalVolume' } }
          }
        }
      ]).toArray();

      const totalChannels = await this.db.getCollection('channels').countDocuments();
      const activeChannels = this.channelCache.size;

      return {
        totalChannels,
        activeChannels,
        statusBreakdown: stats,
        metrics: this.metrics,
        cacheSize: this.channelCache.size
      };

    } catch (error) {
      this.logger.error({ error }, 'Failed to get channel stats');
      throw error;
    }
  }

  /**
   * Checks for channel timeouts
   */
  async checkChannelTimeouts(): Promise<void> {
    try {
      const now = new Date();
      const timedOutChannels = await this.db.getCollection('channels').find({
        status: 'ACTIVE',
        timeoutAt: { $lt: now }
      }).toArray();

      for (const channel of timedOutChannels) {
        await this.handleChannelTimeout(channel.channelId);
      }

      if (timedOutChannels.length > 0) {
        this.logger.info({ count: timedOutChannels.length }, 'Processed channel timeouts');
      }

    } catch (error) {
      this.logger.error({ error }, 'Failed to check channel timeouts');
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Validates channel creation parameters
   */
  private validateChannelParams(params: ChannelParams): void {
    if (params.trader.value === params.lp.value) {
      throw new ValidationError('Trader and LP cannot be the same address');
    }

    if (params.traderDeposit <= 0n || params.lpDeposit <= 0n) {
      throw new ValidationError('Deposits must be positive');
    }

    if (params.timeout < BigInt(CONSTANTS.CHANNEL_TIMEOUT_MS / 1000)) {
      throw new ValidationError('Timeout too short');
    }
  }

  /**
   * Validates state transition
   */
  private validateStateTransition(
    currentState: ChannelState,
    newState: ChannelState,
    messageType: string
  ): void {
    // Validate nonce progression
    if (newState.nonce <= currentState.nonce) {
      throw new ValidationError('New nonce must be greater than current nonce');
    }

    // Validate channel ID consistency
    if (newState.channelId.value !== currentState.channelId.value) {
      throw new ValidationError('Channel ID mismatch');
    }

    // Validate participants consistency
    if (newState.trader.value !== currentState.trader.value ||
        newState.lp.value !== currentState.lp.value) {
      throw new ValidationError('Participants cannot change');
    }

    // Validate timestamp progression
    if (newState.timestamp <= currentState.timestamp) {
      throw new ValidationError('New timestamp must be greater than current timestamp');
    }
  }

  /**
   * Validates quote request
   */
  private validateQuoteRequest(request: QuoteRequest, currentState: ChannelState): void {
    if (request.trader.value !== currentState.trader.value) {
      throw new ValidationError('Quote request must come from channel trader');
    }

    if (request.quantity <= 0n) {
      throw new ValidationError('Quote quantity must be positive');
    }

    if (request.maxSlippageBps > CONSTANTS.MAX_SLIPPAGE_BPS) {
      throw new ValidationError('Max slippage too high');
    }
  }

  /**
   * Validates fill message
   */
  private validateFill(fill: Fill, currentState: ChannelState): void {
    if (fill.quantity <= 0n || fill.price <= 0n) {
      throw new ValidationError('Fill quantity and price must be positive');
    }

    if (fill.trader.value !== currentState.trader.value ||
        fill.lp.value !== currentState.lp.value) {
      throw new ValidationError('Fill participants must match channel participants');
    }
  }

  /**
   * Validates cancel message
   */
  private validateCancel(cancel: Cancel, currentState: ChannelState): void {
    if (cancel.trader.value !== currentState.trader.value) {
      throw new ValidationError('Cancel must come from channel trader');
    }
  }

  /**
   * Validates checkpoint request
   */
  private validateCheckpointRequest(request: CheckpointRequest, currentState: ChannelState): void {
    if (request.state.nonce <= currentState.nonce) {
      throw new ValidationError('Checkpoint nonce must be greater than current nonce');
    }

    if (request.state.channelId.value !== currentState.channelId.value) {
      throw new ValidationError('Channel ID mismatch in checkpoint');
    }
  }

  /**
   * Calculates post-fill channel state
   */
  private calculatePostFillState(currentState: ChannelState, fill: Fill): ChannelState {
    // This is a simplified calculation - in production, this would involve
    // complex balance updates based on the specific fill details
    const newState: ChannelState = {
      ...currentState,
      nonce: fill.nonce,
      timestamp: fill.timestamp
    };

    // Update balances based on fill
    // Implementation would depend on specific token pair and fill logic

    return newState;
  }

  /**
   * Calculates state hash for verification
   */
  private calculateStateHash(state: ChannelState): string {
    const serialized = this.serializeChannelState(state);
    return ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(serialized)));
  }

  /**
   * Serializes channel state for storage
   */
  private serializeChannelState(state: ChannelState): any {
    return {
      channelId: state.channelId.value,
      nonce: state.nonce.toString(),
      trader: state.trader.value,
      lp: state.lp.value,
      traderBalances: state.traderBalances.map(b => ({
        token: b.token.value,
        amount: b.amount.toString()
      })),
      lpBalances: state.lpBalances.map(b => ({
        token: b.token.value,
        amount: b.amount.toString()
      })),
      timestamp: state.timestamp.toString(),
      chainId: state.chainId.value
    };
  }

  /**
   * Deserializes channel state from storage
   */
  private deserializeChannelState(doc: any): ChannelState {
    return {
      channelId: { value: doc.channelId },
      nonce: BigInt(doc.nonce),
      trader: createAddress(doc.trader),
      lp: createAddress(doc.lp),
      traderBalances: doc.traderBalances.map((b: any) => 
        createTokenAmount(b.token, BigInt(b.amount))
      ),
      lpBalances: doc.lpBalances.map((b: any) => 
        createTokenAmount(b.token, BigInt(b.amount))
      ),
      timestamp: BigInt(doc.timestamp),
      chainId: { value: doc.chainId }
    };
  }

  /**
   * Stores message in history
   */
  private async storeMessage(
    channelId: string,
    messageType: string,
    messageData: any,
    nonce: bigint
  ): Promise<void> {
    await this.db.getCollection('messages').insertOne({
      channelId,
      messageType,
      messageData,
      nonce: nonce.toString(),
      timestamp: new Date(),
      processed: true
    });
  }

  /**
   * Sets up channel timeout
   */
  private setupChannelTimeout(channelId: string, timeoutAt: Date): void {
    const timeoutMs = timeoutAt.getTime() - Date.now();
    if (timeoutMs > 0) {
      const timer = setTimeout(() => {
        this.handleChannelTimeout(channelId);
      }, timeoutMs);
      
      this.timeoutTimers.set(channelId, timer);
    }
  }

  /**
   * Clears channel timeout
   */
  private clearChannelTimeout(channelId: string): void {
    const timer = this.timeoutTimers.get(channelId);
    if (timer) {
      clearTimeout(timer);
      this.timeoutTimers.delete(channelId);
    }
  }

  /**
   * Handles channel timeout
   */
  private async handleChannelTimeout(channelId: string): Promise<void> {
    try {
      await this.db.getCollection('channels').updateOne(
        { channelId },
        { 
          $set: { 
            status: 'TIMEOUT',
            timedOutAt: new Date()
          } 
        }
      );

      this.channelCache.delete(channelId);
      this.clearChannelTimeout(channelId);
      this.metrics.timeouts++;

      this.logger.warn({ channelId }, 'Channel timed out');

    } catch (error) {
      this.logger.error({ error, channelId }, 'Failed to handle channel timeout');
    }
  }

  /**
   * Executes function with distributed lock
   */
  private async withChannelLock<T>(
    channelId: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const lockKey = `lock:channel:${channelId}`;
    const lockValue = uuidv4();
    const lockTtl = 30; // 30 seconds

    try {
      // Acquire lock
      const acquired = await this.redis.set(lockKey, lockValue, 'EX', lockTtl, 'NX');
      if (!acquired) {
        // Wait for existing lock to release
        const existingLock = this.channelLocks.get(channelId);
        if (existingLock) {
          await existingLock;
        }
        // Retry lock acquisition
        const retryAcquired = await this.redis.set(lockKey, lockValue, 'EX', lockTtl, 'NX');
        if (!retryAcquired) {
          throw new Error(`Failed to acquire lock for channel ${channelId}`);
        }
      }

      // Execute function
      const promise = fn();
      this.channelLocks.set(channelId, promise);
      
      const result = await promise;
      
      return result;

    } finally {
      // Release lock
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      await this.redis.eval(script, 1, lockKey, lockValue);
      this.channelLocks.delete(channelId);
    }
  }

  /**
   * Syncs cache with database
   */
  private async syncCacheWithDatabase(): Promise<void> {
    try {
      const cacheKeys = Array.from(this.channelCache.keys());
      if (cacheKeys.length === 0) return;

      const dbChannels = await this.db.getCollection('channels').find({
        channelId: { $in: cacheKeys },
        status: { $in: ['ACTIVE', 'CHECKPOINTING'] }
      }).toArray();

      const dbChannelMap = new Map(dbChannels.map(ch => [ch.channelId, ch]));

      // Update cache with latest database state
      for (const channelId of cacheKeys) {
        const dbChannel = dbChannelMap.get(channelId);
        if (dbChannel) {
          const state = this.deserializeChannelState(dbChannel);
          this.channelCache.set(channelId, state);
        } else {
          // Channel no longer active, remove from cache
          this.channelCache.delete(channelId);
          this.clearChannelTimeout(channelId);
        }
      }

    } catch (error) {
      this.logger.error({ error }, 'Failed to sync cache with database');
    }
  }

  /**
   * Cleans up expired channels
   */
  private async cleanupExpiredChannels(): Promise<void> {
    try {
      const expiredChannels = await this.db.getCollection('channels').find({
        status: 'TIMEOUT',
        timedOutAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 24 hours ago
      }).toArray();

      for (const channel of expiredChannels) {
        await this.db.getCollection('channels').updateOne(
          { channelId: channel.channelId },
          { $set: { status: 'EXPIRED' } }
        );
      }

      if (expiredChannels.length > 0) {
        this.logger.info({ count: expiredChannels.length }, 'Cleaned up expired channels');
      }

    } catch (error) {
      this.logger.error({ error }, 'Failed to cleanup expired channels');
    }
  }

  /**
   * Updates performance metrics
   */
  private async updateMetrics(): Promise<void> {
    try {
      await this.redis.hmset('coordinator:metrics', {
        channelsCreated: this.metrics.channelsCreated.toString(),
        channelsClosed: this.metrics.channelsClosed.toString(),
        stateTransitions: this.metrics.stateTransitions.toString(),
        timeouts: this.metrics.timeouts.toString(),
        errors: this.metrics.errors.toString(),
        activeChannels: this.channelCache.size.toString(),
        timestamp: Date.now().toString()
      });

    } catch (error) {
      this.logger.error({ error }, 'Failed to update metrics');
    }
  }
}