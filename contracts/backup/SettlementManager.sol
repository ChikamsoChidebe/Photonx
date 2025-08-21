// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title SettlementManager
 * @dev Core contract for managing ERC-7824 state channels in PhotonX
 * Handles channel lifecycle: open, checkpoint, close, dispute resolution
 */
contract SettlementManager is ReentrancyGuard, Pausable, AccessControl, EIP712 {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    // ============================================================================
    // CONSTANTS AND ROLES
    // ============================================================================

    bytes32 public constant COORDINATOR_ROLE = keccak256("COORDINATOR_ROLE");
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    uint256 public constant DISPUTE_WINDOW = 24 hours;
    uint256 public constant CHANNEL_TIMEOUT = 7 days;
    uint256 public constant MAX_TOKENS_PER_CHANNEL = 10;
    uint256 public constant MIN_DEPOSIT = 1e15; // 0.001 tokens
    uint256 public constant MAX_DEPOSIT = 1e27; // 1B tokens

    // EIP-712 Type Hashes
    bytes32 public constant CHANNEL_STATE_TYPEHASH = keccak256(
        "ChannelState(string channelId,uint256 nonce,address trader,address lp,TokenAmount[] traderBalances,TokenAmount[] lpBalances,uint256 timestamp,uint256 chainId)TokenAmount(address token,uint256 amount)"
    );
    
    bytes32 public constant TOKEN_AMOUNT_TYPEHASH = keccak256(
        "TokenAmount(address token,uint256 amount)"
    );

    bytes32 public constant SETTLEMENT_REQUEST_TYPEHASH = keccak256(
        "SettlementRequest(string channelId,ChannelState finalState,bytes traderSignature,bytes lpSignature)ChannelState(string channelId,uint256 nonce,address trader,address lp,TokenAmount[] traderBalances,TokenAmount[] lpBalances,uint256 timestamp,uint256 chainId)TokenAmount(address token,uint256 amount)"
    );

    bytes32 public constant CHECKPOINT_REQUEST_TYPEHASH = keccak256(
        "CheckpointRequest(string channelId,ChannelState state,bytes traderSignature,bytes lpSignature)ChannelState(string channelId,uint256 nonce,address trader,address lp,TokenAmount[] traderBalances,TokenAmount[] lpBalances,uint256 timestamp,uint256 chainId)TokenAmount(address token,uint256 amount)"
    );

    // ============================================================================
    // STRUCTS
    // ============================================================================

    struct TokenAmount {
        address token;
        uint256 amount;
    }

    struct ChannelState {
        string channelId;
        uint256 nonce;
        address trader;
        address lp;
        TokenAmount[] traderBalances;
        TokenAmount[] lpBalances;
        uint256 timestamp;
        uint256 chainId;
    }

    struct Channel {
        string channelId;
        address trader;
        address lp;
        mapping(address => uint256) traderDeposits;
        mapping(address => uint256) lpDeposits;
        address[] tokens;
        uint256 nonce;
        uint256 openedAt;
        uint256 lastCheckpointAt;
        uint256 timeoutAt;
        ChannelStatus status;
        bytes32 lastStateHash;
        uint256 disputeDeadline;
        address challenger;
    }

    struct SettlementRequest {
        string channelId;
        ChannelState finalState;
        bytes traderSignature;
        bytes lpSignature;
    }

    struct CheckpointRequest {
        string channelId;
        ChannelState state;
        bytes traderSignature;
        bytes lpSignature;
    }

    struct DisputeChallenge {
        string channelId;
        ChannelState challengeState;
        bytes challengerSignature;
        bytes counterpartySignature;
    }

    enum ChannelStatus {
        OPENING,
        ACTIVE,
        CHECKPOINTING,
        SETTLING,
        CLOSED,
        DISPUTED,
        EMERGENCY_CLOSED
    }

    // ============================================================================
    // STATE VARIABLES
    // ============================================================================

    mapping(string => Channel) public channels;
    mapping(address => string[]) public userChannels;
    mapping(address => bool) public supportedTokens;
    mapping(address => uint256) public tokenMinDeposits;
    mapping(address => uint256) public tokenMaxDeposits;

    string[] public allChannelIds;
    uint256 public totalChannels;
    uint256 public activeChannels;
    uint256 public totalVolume;
    uint256 public totalFees;

    // Fee structure
    uint256 public protocolFeeBps = 10; // 0.1%
    uint256 public settlementFeeBps = 5; // 0.05%
    address public feeRecipient;

    // Emergency controls
    bool public emergencyMode;
    uint256 public emergencyModeActivatedAt;

    // ============================================================================
    // EVENTS
    // ============================================================================

    event ChannelOpened(
        string indexed channelId,
        address indexed trader,
        address indexed lp,
        address[] tokens,
        uint256[] traderDeposits,
        uint256[] lpDeposits,
        uint256 timeoutAt
    );

    event ChannelCheckpointed(
        string indexed channelId,
        uint256 nonce,
        bytes32 stateHash,
        uint256 timestamp
    );

    event ChannelClosed(
        string indexed channelId,
        uint256 finalNonce,
        bytes32 finalStateHash,
        uint256 timestamp
    );

    event ChannelDisputed(
        string indexed channelId,
        address indexed challenger,
        uint256 challengeNonce,
        uint256 disputeDeadline
    );

    event DisputeResolved(
        string indexed channelId,
        address indexed winner,
        uint256 finalNonce,
        bytes32 finalStateHash
    );

    event TokensWithdrawn(
        string indexed channelId,
        address indexed user,
        address indexed token,
        uint256 amount
    );

    event EmergencyModeActivated(uint256 timestamp);
    event EmergencyModeDeactivated(uint256 timestamp);

    event ProtocolFeeUpdated(uint256 oldFee, uint256 newFee);
    event SettlementFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeRecipientUpdated(address oldRecipient, address newRecipient);

    event TokenSupportUpdated(address indexed token, bool supported);
    event TokenLimitsUpdated(address indexed token, uint256 minDeposit, uint256 maxDeposit);

    // ============================================================================
    // MODIFIERS
    // ============================================================================

    modifier onlyChannelParticipant(string memory channelId) {
        Channel storage channel = channels[channelId];
        require(
            msg.sender == channel.trader || msg.sender == channel.lp,
            "Not channel participant"
        );
        _;
    }

    modifier onlyActiveChannel(string memory channelId) {
        require(channels[channelId].status == ChannelStatus.ACTIVE, "Channel not active");
        _;
    }

    modifier onlyValidChannel(string memory channelId) {
        require(bytes(channels[channelId].channelId).length > 0, "Channel does not exist");
        _;
    }

    modifier notInEmergencyMode() {
        require(!emergencyMode, "Emergency mode active");
        _;
    }

    modifier onlyInEmergencyMode() {
        require(emergencyMode, "Emergency mode not active");
        _;
    }

    modifier validTimeout(uint256 timeout) {
        require(timeout >= 1 hours && timeout <= CHANNEL_TIMEOUT, "Invalid timeout");
        _;
    }

    // ============================================================================
    // CONSTRUCTOR
    // ============================================================================

    constructor(
        address _admin,
        address _coordinator,
        address _feeRecipient
    ) EIP712("PhotonX", "1") {
        require(_admin != address(0), "Invalid admin address");
        require(_coordinator != address(0), "Invalid coordinator address");
        require(_feeRecipient != address(0), "Invalid fee recipient address");

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(COORDINATOR_ROLE, _coordinator);
        _grantRole(RELAYER_ROLE, _coordinator);
        _grantRole(EMERGENCY_ROLE, _admin);

        feeRecipient = _feeRecipient;
    }

    // ============================================================================
    // CHANNEL LIFECYCLE FUNCTIONS
    // ============================================================================

    /**
     * @dev Opens a new state channel between trader and LP
     * @param channelId Unique identifier for the channel
     * @param trader Address of the trader
     * @param lp Address of the liquidity provider
     * @param tokens Array of token addresses to be used in the channel
     * @param traderDeposits Array of deposit amounts from trader
     * @param lpDeposits Array of deposit amounts from LP
     * @param timeout Channel timeout in seconds
     */
    function openChannel(
        string memory channelId,
        address trader,
        address lp,
        address[] memory tokens,
        uint256[] memory traderDeposits,
        uint256[] memory lpDeposits,
        uint256 timeout
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        notInEmergencyMode
        validTimeout(timeout)
        onlyRole(COORDINATOR_ROLE)
    {
        require(bytes(channelId).length > 0, "Invalid channel ID");
        require(trader != address(0) && lp != address(0), "Invalid participant addresses");
        require(trader != lp, "Trader and LP cannot be the same");
        require(tokens.length > 0 && tokens.length <= MAX_TOKENS_PER_CHANNEL, "Invalid tokens array");
        require(
            tokens.length == traderDeposits.length && 
            tokens.length == lpDeposits.length, 
            "Array length mismatch"
        );
        require(bytes(channels[channelId].channelId).length == 0, "Channel already exists");

        // Validate tokens and deposits
        for (uint256 i = 0; i < tokens.length; i++) {
            require(supportedTokens[tokens[i]], "Token not supported");
            require(
                traderDeposits[i] >= tokenMinDeposits[tokens[i]] && 
                traderDeposits[i] <= tokenMaxDeposits[tokens[i]],
                "Invalid trader deposit amount"
            );
            require(
                lpDeposits[i] >= tokenMinDeposits[tokens[i]] && 
                lpDeposits[i] <= tokenMaxDeposits[tokens[i]],
                "Invalid LP deposit amount"
            );
        }

        // Create channel
        Channel storage channel = channels[channelId];
        channel.channelId = channelId;
        channel.trader = trader;
        channel.lp = lp;
        channel.tokens = tokens;
        channel.nonce = 0;
        channel.openedAt = block.timestamp;
        channel.lastCheckpointAt = block.timestamp;
        channel.timeoutAt = block.timestamp + timeout;
        channel.status = ChannelStatus.OPENING;

        // Process deposits
        for (uint256 i = 0; i < tokens.length; i++) {
            address token = tokens[i];
            uint256 traderDeposit = traderDeposits[i];
            uint256 lpDeposit = lpDeposits[i];

            if (traderDeposit > 0) {
                IERC20(token).safeTransferFrom(trader, address(this), traderDeposit);
                channel.traderDeposits[token] = traderDeposit;
            }

            if (lpDeposit > 0) {
                IERC20(token).safeTransferFrom(lp, address(this), lpDeposit);
                channel.lpDeposits[token] = lpDeposit;
            }
        }

        // Update global state
        allChannelIds.push(channelId);
        userChannels[trader].push(channelId);
        userChannels[lp].push(channelId);
        totalChannels++;
        activeChannels++;

        // Activate channel
        channel.status = ChannelStatus.ACTIVE;

        emit ChannelOpened(
            channelId,
            trader,
            lp,
            tokens,
            traderDeposits,
            lpDeposits,
            channel.timeoutAt
        );
    }

    /**
     * @dev Creates a checkpoint for the channel state
     * @param request Checkpoint request with signatures
     */
    function checkpoint(CheckpointRequest memory request) 
        external 
        nonReentrant 
        whenNotPaused 
        onlyValidChannel(request.channelId)
        onlyActiveChannel(request.channelId)
        onlyRole(RELAYER_ROLE)
    {
        Channel storage channel = channels[request.channelId];
        
        // Validate nonce progression
        require(request.state.nonce > channel.nonce, "Invalid nonce");
        
        // Validate state consistency
        require(
            keccak256(bytes(request.state.channelId)) == keccak256(bytes(request.channelId)),
            "Channel ID mismatch"
        );
        require(request.state.trader == channel.trader, "Trader mismatch");
        require(request.state.lp == channel.lp, "LP mismatch");
        require(request.state.chainId == block.chainid, "Chain ID mismatch");

        // Verify signatures
        bytes32 stateHash = _hashChannelState(request.state);
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
            CHECKPOINT_REQUEST_TYPEHASH,
            keccak256(bytes(request.channelId)),
            stateHash,
            keccak256(request.traderSignature),
            keccak256(request.lpSignature)
        )));

        require(_verifySignature(digest, request.traderSignature, channel.trader), "Invalid trader signature");
        require(_verifySignature(digest, request.lpSignature, channel.lp), "Invalid LP signature");

        // Update channel state
        channel.nonce = request.state.nonce;
        channel.lastCheckpointAt = block.timestamp;
        channel.lastStateHash = stateHash;
        channel.status = ChannelStatus.CHECKPOINTING;

        emit ChannelCheckpointed(
            request.channelId,
            request.state.nonce,
            stateHash,
            block.timestamp
        );

        // Return to active status
        channel.status = ChannelStatus.ACTIVE;
    }

    /**
     * @dev Closes a channel and settles final balances
     * @param request Settlement request with final state and signatures
     */
    function close(SettlementRequest memory request) 
        external 
        nonReentrant 
        whenNotPaused 
        onlyValidChannel(request.channelId)
        onlyRole(RELAYER_ROLE)
    {
        Channel storage channel = channels[request.channelId];
        require(
            channel.status == ChannelStatus.ACTIVE || 
            channel.status == ChannelStatus.CHECKPOINTING,
            "Channel not closeable"
        );

        // Validate final state
        require(request.finalState.nonce >= channel.nonce, "Invalid final nonce");
        require(
            keccak256(bytes(request.finalState.channelId)) == keccak256(bytes(request.channelId)),
            "Channel ID mismatch"
        );
        require(request.finalState.trader == channel.trader, "Trader mismatch");
        require(request.finalState.lp == channel.lp, "LP mismatch");
        require(request.finalState.chainId == block.chainid, "Chain ID mismatch");

        // Verify signatures
        bytes32 stateHash = _hashChannelState(request.finalState);
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
            SETTLEMENT_REQUEST_TYPEHASH,
            keccak256(bytes(request.channelId)),
            stateHash,
            keccak256(request.traderSignature),
            keccak256(request.lpSignature)
        )));

        require(_verifySignature(digest, request.traderSignature, channel.trader), "Invalid trader signature");
        require(_verifySignature(digest, request.lpSignature, channel.lp), "Invalid LP signature");

        // Update channel status
        channel.status = ChannelStatus.SETTLING;
        channel.nonce = request.finalState.nonce;
        channel.lastStateHash = stateHash;

        // Calculate and distribute final balances
        _settleBalances(request.channelId, request.finalState);

        // Close channel
        channel.status = ChannelStatus.CLOSED;
        activeChannels--;

        emit ChannelClosed(
            request.channelId,
            request.finalState.nonce,
            stateHash,
            block.timestamp
        );
    }

    /**
     * @dev Initiates a dispute for a channel
     * @param challenge Dispute challenge with higher state
     */
    function challenge(DisputeChallenge memory challenge) 
        external 
        nonReentrant 
        whenNotPaused 
        onlyValidChannel(challenge.channelId)
        onlyChannelParticipant(challenge.channelId)
    {
        Channel storage channel = channels[challenge.channelId];
        require(
            channel.status == ChannelStatus.ACTIVE || 
            channel.status == ChannelStatus.SETTLING,
            "Channel not challengeable"
        );

        // Validate challenge state
        require(challenge.challengeState.nonce > channel.nonce, "Challenge nonce not higher");
        require(
            keccak256(bytes(challenge.challengeState.channelId)) == keccak256(bytes(challenge.channelId)),
            "Channel ID mismatch"
        );

        // Verify signatures
        bytes32 stateHash = _hashChannelState(challenge.challengeState);
        require(
            _verifySignature(stateHash, challenge.challengerSignature, msg.sender),
            "Invalid challenger signature"
        );

        address counterparty = msg.sender == channel.trader ? channel.lp : channel.trader;
        require(
            _verifySignature(stateHash, challenge.counterpartySignature, counterparty),
            "Invalid counterparty signature"
        );

        // Update channel to disputed state
        channel.status = ChannelStatus.DISPUTED;
        channel.nonce = challenge.challengeState.nonce;
        channel.lastStateHash = stateHash;
        channel.disputeDeadline = block.timestamp + DISPUTE_WINDOW;
        channel.challenger = msg.sender;

        emit ChannelDisputed(
            challenge.channelId,
            msg.sender,
            challenge.challengeState.nonce,
            channel.disputeDeadline
        );
    }

    /**
     * @dev Resolves a dispute after the dispute window
     * @param channelId Channel identifier
     */
    function resolveDispute(string memory channelId) 
        external 
        nonReentrant 
        whenNotPaused 
        onlyValidChannel(channelId)
    {
        Channel storage channel = channels[channelId];
        require(channel.status == ChannelStatus.DISPUTED, "Channel not disputed");
        require(block.timestamp >= channel.disputeDeadline, "Dispute window not expired");

        // Challenger wins by default if no counter-challenge
        address winner = channel.challenger;
        
        // Settle based on last valid state
        ChannelState memory finalState = _reconstructChannelState(channelId);
        _settleBalances(channelId, finalState);

        // Close channel
        channel.status = ChannelStatus.CLOSED;
        activeChannels--;

        emit DisputeResolved(
            channelId,
            winner,
            channel.nonce,
            channel.lastStateHash
        );
    }

    /**
     * @dev Force closes a channel after timeout
     * @param channelId Channel identifier
     */
    function forceClose(string memory channelId) 
        external 
        nonReentrant 
        whenNotPaused 
        onlyValidChannel(channelId)
        onlyChannelParticipant(channelId)
    {
        Channel storage channel = channels[channelId];
        require(channel.status == ChannelStatus.ACTIVE, "Channel not active");
        require(block.timestamp >= channel.timeoutAt, "Channel not timed out");

        // Revert to initial deposits
        for (uint256 i = 0; i < channel.tokens.length; i++) {
            address token = channel.tokens[i];
            
            uint256 traderAmount = channel.traderDeposits[token];
            uint256 lpAmount = channel.lpDeposits[token];

            if (traderAmount > 0) {
                IERC20(token).safeTransfer(channel.trader, traderAmount);
                emit TokensWithdrawn(channelId, channel.trader, token, traderAmount);
            }

            if (lpAmount > 0) {
                IERC20(token).safeTransfer(channel.lp, lpAmount);
                emit TokensWithdrawn(channelId, channel.lp, token, lpAmount);
            }
        }

        channel.status = ChannelStatus.CLOSED;
        activeChannels--;

        emit ChannelClosed(channelId, channel.nonce, channel.lastStateHash, block.timestamp);
    }

    // ============================================================================
    // INTERNAL FUNCTIONS
    // ============================================================================

    /**
     * @dev Settles final balances based on channel state
     */
    function _settleBalances(string memory channelId, ChannelState memory finalState) internal {
        Channel storage channel = channels[channelId];
        
        // Calculate protocol fees
        uint256 totalTraderValue = 0;
        uint256 totalLpValue = 0;

        // Process trader balances
        for (uint256 i = 0; i < finalState.traderBalances.length; i++) {
            TokenAmount memory balance = finalState.traderBalances[i];
            if (balance.amount > 0) {
                uint256 protocolFee = (balance.amount * protocolFeeBps) / 10000;
                uint256 netAmount = balance.amount - protocolFee;

                IERC20(balance.token).safeTransfer(channel.trader, netAmount);
                if (protocolFee > 0) {
                    IERC20(balance.token).safeTransfer(feeRecipient, protocolFee);
                    totalFees += protocolFee;
                }

                totalTraderValue += balance.amount;
                emit TokensWithdrawn(channelId, channel.trader, balance.token, netAmount);
            }
        }

        // Process LP balances
        for (uint256 i = 0; i < finalState.lpBalances.length; i++) {
            TokenAmount memory balance = finalState.lpBalances[i];
            if (balance.amount > 0) {
                uint256 protocolFee = (balance.amount * protocolFeeBps) / 10000;
                uint256 netAmount = balance.amount - protocolFee;

                IERC20(balance.token).safeTransfer(channel.lp, netAmount);
                if (protocolFee > 0) {
                    IERC20(balance.token).safeTransfer(feeRecipient, protocolFee);
                    totalFees += protocolFee;
                }

                totalLpValue += balance.amount;
                emit TokensWithdrawn(channelId, channel.lp, balance.token, netAmount);
            }
        }

        totalVolume += totalTraderValue + totalLpValue;
    }

    /**
     * @dev Hashes a channel state for signature verification
     */
    function _hashChannelState(ChannelState memory state) internal pure returns (bytes32) {
        bytes32[] memory traderBalanceHashes = new bytes32[](state.traderBalances.length);
        for (uint256 i = 0; i < state.traderBalances.length; i++) {
            traderBalanceHashes[i] = keccak256(abi.encode(
                TOKEN_AMOUNT_TYPEHASH,
                state.traderBalances[i].token,
                state.traderBalances[i].amount
            ));
        }

        bytes32[] memory lpBalanceHashes = new bytes32[](state.lpBalances.length);
        for (uint256 i = 0; i < state.lpBalances.length; i++) {
            lpBalanceHashes[i] = keccak256(abi.encode(
                TOKEN_AMOUNT_TYPEHASH,
                state.lpBalances[i].token,
                state.lpBalances[i].amount
            ));
        }

        return keccak256(abi.encode(
            CHANNEL_STATE_TYPEHASH,
            keccak256(bytes(state.channelId)),
            state.nonce,
            state.trader,
            state.lp,
            keccak256(abi.encodePacked(traderBalanceHashes)),
            keccak256(abi.encodePacked(lpBalanceHashes)),
            state.timestamp,
            state.chainId
        ));
    }

    /**
     * @dev Verifies a signature against a hash and expected signer
     */
    function _verifySignature(
        bytes32 hash,
        bytes memory signature,
        address expectedSigner
    ) internal pure returns (bool) {
        address recovered = hash.recover(signature);
        return recovered == expectedSigner;
    }

    /**
     * @dev Reconstructs channel state from storage
     */
    function _reconstructChannelState(string memory channelId) internal view returns (ChannelState memory) {
        Channel storage channel = channels[channelId];
        
        TokenAmount[] memory traderBalances = new TokenAmount[](channel.tokens.length);
        TokenAmount[] memory lpBalances = new TokenAmount[](channel.tokens.length);

        for (uint256 i = 0; i < channel.tokens.length; i++) {
            address token = channel.tokens[i];
            traderBalances[i] = TokenAmount({
                token: token,
                amount: channel.traderDeposits[token]
            });
            lpBalances[i] = TokenAmount({
                token: token,
                amount: channel.lpDeposits[token]
            });
        }

        return ChannelState({
            channelId: channelId,
            nonce: channel.nonce,
            trader: channel.trader,
            lp: channel.lp,
            traderBalances: traderBalances,
            lpBalances: lpBalances,
            timestamp: block.timestamp,
            chainId: block.chainid
        });
    }

    // ============================================================================
    // ADMIN FUNCTIONS
    // ============================================================================

    /**
     * @dev Adds support for a new token
     */
    function addSupportedToken(
        address token,
        uint256 minDeposit,
        uint256 maxDeposit
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(token != address(0), "Invalid token address");
        require(minDeposit >= MIN_DEPOSIT, "Min deposit too low");
        require(maxDeposit <= MAX_DEPOSIT, "Max deposit too high");
        require(minDeposit <= maxDeposit, "Invalid deposit range");

        supportedTokens[token] = true;
        tokenMinDeposits[token] = minDeposit;
        tokenMaxDeposits[token] = maxDeposit;

        emit TokenSupportUpdated(token, true);
        emit TokenLimitsUpdated(token, minDeposit, maxDeposit);
    }

    /**
     * @dev Removes support for a token
     */
    function removeSupportedToken(address token) external onlyRole(DEFAULT_ADMIN_ROLE) {
        supportedTokens[token] = false;
        emit TokenSupportUpdated(token, false);
    }

    /**
     * @dev Updates protocol fee
     */
    function setProtocolFee(uint256 newFeeBps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newFeeBps <= 1000, "Fee too high"); // Max 10%
        uint256 oldFee = protocolFeeBps;
        protocolFeeBps = newFeeBps;
        emit ProtocolFeeUpdated(oldFee, newFeeBps);
    }

    /**
     * @dev Updates settlement fee
     */
    function setSettlementFee(uint256 newFeeBps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newFeeBps <= 500, "Fee too high"); // Max 5%
        uint256 oldFee = settlementFeeBps;
        settlementFeeBps = newFeeBps;
        emit SettlementFeeUpdated(oldFee, newFeeBps);
    }

    /**
     * @dev Updates fee recipient
     */
    function setFeeRecipient(address newRecipient) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newRecipient != address(0), "Invalid recipient");
        address oldRecipient = feeRecipient;
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(oldRecipient, newRecipient);
    }

    /**
     * @dev Activates emergency mode
     */
    function activateEmergencyMode() external onlyRole(EMERGENCY_ROLE) {
        require(!emergencyMode, "Already in emergency mode");
        emergencyMode = true;
        emergencyModeActivatedAt = block.timestamp;
        _pause();
        emit EmergencyModeActivated(block.timestamp);
    }

    /**
     * @dev Deactivates emergency mode
     */
    function deactivateEmergencyMode() external onlyRole(EMERGENCY_ROLE) {
        require(emergencyMode, "Not in emergency mode");
        emergencyMode = false;
        _unpause();
        emit EmergencyModeDeactivated(block.timestamp);
    }

    /**
     * @dev Emergency close all active channels
     */
    function emergencyCloseAll() external onlyRole(EMERGENCY_ROLE) onlyInEmergencyMode {
        for (uint256 i = 0; i < allChannelIds.length; i++) {
            string memory channelId = allChannelIds[i];
            Channel storage channel = channels[channelId];
            
            if (channel.status == ChannelStatus.ACTIVE) {
                // Revert to initial deposits
                for (uint256 j = 0; j < channel.tokens.length; j++) {
                    address token = channel.tokens[j];
                    
                    uint256 traderAmount = channel.traderDeposits[token];
                    uint256 lpAmount = channel.lpDeposits[token];

                    if (traderAmount > 0) {
                        IERC20(token).safeTransfer(channel.trader, traderAmount);
                    }

                    if (lpAmount > 0) {
                        IERC20(token).safeTransfer(channel.lp, lpAmount);
                    }
                }

                channel.status = ChannelStatus.EMERGENCY_CLOSED;
                activeChannels--;
            }
        }
    }

    // ============================================================================
    // VIEW FUNCTIONS
    // ============================================================================

    /**
     * @dev Gets channel information
     */
    function getChannel(string memory channelId) external view returns (
        address trader,
        address lp,
        address[] memory tokens,
        uint256 nonce,
        uint256 openedAt,
        uint256 timeoutAt,
        ChannelStatus status,
        bytes32 lastStateHash
    ) {
        Channel storage channel = channels[channelId];
        return (
            channel.trader,
            channel.lp,
            channel.tokens,
            channel.nonce,
            channel.openedAt,
            channel.timeoutAt,
            channel.status,
            channel.lastStateHash
        );
    }

    /**
     * @dev Gets channel deposits for a specific token
     */
    function getChannelDeposits(string memory channelId, address token) external view returns (
        uint256 traderDeposit,
        uint256 lpDeposit
    ) {
        Channel storage channel = channels[channelId];
        return (channel.traderDeposits[token], channel.lpDeposits[token]);
    }

    /**
     * @dev Gets all channels for a user
     */
    function getUserChannels(address user) external view returns (string[] memory) {
        return userChannels[user];
    }

    /**
     * @dev Gets protocol statistics
     */
    function getProtocolStats() external view returns (
        uint256 _totalChannels,
        uint256 _activeChannels,
        uint256 _totalVolume,
        uint256 _totalFees,
        uint256 _protocolFeeBps,
        uint256 _settlementFeeBps
    ) {
        return (
            totalChannels,
            activeChannels,
            totalVolume,
            totalFees,
            protocolFeeBps,
            settlementFeeBps
        );
    }

    /**
     * @dev Checks if a token is supported
     */
    function isTokenSupported(address token) external view returns (bool) {
        return supportedTokens[token];
    }

    /**
     * @dev Gets token deposit limits
     */
    function getTokenLimits(address token) external view returns (uint256 minDeposit, uint256 maxDeposit) {
        return (tokenMinDeposits[token], tokenMaxDeposits[token]);
    }

    /**
     * @dev Gets the domain separator for EIP-712
     */
    function getDomainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    // ============================================================================
    // EMERGENCY RECOVERY
    // ============================================================================

    /**
     * @dev Recovers stuck tokens (emergency only)
     */
    function recoverTokens(
        address token,
        address to,
        uint256 amount
    ) external onlyRole(EMERGENCY_ROLE) onlyInEmergencyMode {
        require(to != address(0), "Invalid recipient");
        IERC20(token).safeTransfer(to, amount);
    }
}