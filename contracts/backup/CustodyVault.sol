// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title CustodyVault
 * @dev Advanced custody vault for PhotonX with yield generation and risk management
 * Handles secure token custody, yield farming, and automated rebalancing
 */
contract CustodyVault is ReentrancyGuard, Pausable, AccessControl {
    using SafeERC20 for IERC20;
    using Math for uint256;

    // ============================================================================
    // CONSTANTS AND ROLES
    // ============================================================================

    bytes32 public constant VAULT_MANAGER_ROLE = keccak256("VAULT_MANAGER_ROLE");
    bytes32 public constant SETTLEMENT_ROLE = keccak256("SETTLEMENT_ROLE");
    bytes32 public constant YIELD_MANAGER_ROLE = keccak256("YIELD_MANAGER_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    uint256 public constant MAX_YIELD_STRATEGIES = 10;
    uint256 public constant MAX_SLIPPAGE_BPS = 1000; // 10%
    uint256 public constant REBALANCE_THRESHOLD_BPS = 500; // 5%
    uint256 public constant MIN_YIELD_THRESHOLD = 1e15; // 0.001 tokens
    uint256 public constant MAX_UTILIZATION_BPS = 8000; // 80%

    // ============================================================================
    // STRUCTS
    // ============================================================================

    struct TokenVault {
        address token;
        uint256 totalDeposits;
        uint256 totalWithdrawals;
        uint256 availableBalance;
        uint256 lockedBalance;
        uint256 yieldGenerated;
        uint256 lastRebalanceAt;
        bool isActive;
        uint256 targetUtilizationBps;
        uint256 maxDepositLimit;
        uint256 minWithdrawalAmount;
    }

    struct YieldStrategy {
        address strategyContract;
        string name;
        uint256 allocatedAmount;
        uint256 targetAllocationBps;
        uint256 currentYield;
        uint256 lastHarvestAt;
        bool isActive;
        uint256 riskScore; // 1-100, higher = riskier
        uint256 minDeposit;
        uint256 maxDeposit;
    }

    struct UserDeposit {
        uint256 amount;
        uint256 depositedAt;
        uint256 lastYieldClaimAt;
        uint256 accumulatedYield;
        bool isLocked;
        uint256 lockExpiresAt;
    }

    struct RebalanceParams {
        address token;
        uint256 targetUtilization;
        uint256 maxSlippage;
        address[] strategies;
        uint256[] targetAllocations;
    }

    struct YieldDistribution {
        uint256 userShare; // BPS
        uint256 protocolShare; // BPS
        uint256 lpIncentiveShare; // BPS
        uint256 treasuryShare; // BPS
    }

    // ============================================================================
    // STATE VARIABLES
    // ============================================================================

    mapping(address => TokenVault) public tokenVaults;
    mapping(address => mapping(address => UserDeposit)) public userDeposits; // user => token => deposit
    mapping(address => YieldStrategy[]) public tokenStrategies; // token => strategies
    mapping(address => mapping(string => uint256)) public strategyIndexes; // token => strategy name => index
    mapping(address => bool) public authorizedTokens;
    mapping(address => uint256) public tokenRiskScores;

    address[] public supportedTokens;
    YieldDistribution public yieldDistribution;

    // Global settings
    uint256 public protocolFeeBps = 100; // 1%
    uint256 public withdrawalFeeBps = 50; // 0.5%
    uint256 public emergencyWithdrawalFeeBps = 500; // 5%
    address public feeRecipient;
    address public treasury;

    // Risk management
    uint256 public maxTotalValueLocked;
    uint256 public currentTotalValueLocked;
    mapping(address => uint256) public tokenMaxTvl;
    mapping(address => uint256) public userMaxDeposit;

    // Yield tracking
    uint256 public totalYieldGenerated;
    uint256 public totalYieldDistributed;
    mapping(address => uint256) public tokenYieldRates; // Annual yield rate in BPS

    // Emergency controls
    bool public emergencyMode;
    bool public depositsEnabled = true;
    bool public withdrawalsEnabled = true;
    bool public yieldHarvestingEnabled = true;

    // ============================================================================
    // EVENTS
    // ============================================================================

    event TokenVaultCreated(
        address indexed token,
        uint256 maxDepositLimit,
        uint256 targetUtilizationBps
    );

    event Deposited(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );

    event Withdrawn(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 fee,
        uint256 timestamp
    );

    event YieldHarvested(
        address indexed token,
        string strategyName,
        uint256 yieldAmount,
        uint256 timestamp
    );

    event YieldDistributed(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );

    event StrategyAdded(
        address indexed token,
        string strategyName,
        address strategyContract,
        uint256 targetAllocationBps
    );

    event StrategyRemoved(
        address indexed token,
        string strategyName
    );

    event Rebalanced(
        address indexed token,
        uint256 totalAmount,
        uint256 timestamp
    );

    event EmergencyWithdrawal(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 fee
    );

    event RiskParametersUpdated(
        address indexed token,
        uint256 riskScore,
        uint256 maxTvl
    );

    event YieldDistributionUpdated(
        uint256 userShare,
        uint256 protocolShare,
        uint256 lpIncentiveShare,
        uint256 treasuryShare
    );

    // ============================================================================
    // MODIFIERS
    // ============================================================================

    modifier onlyAuthorizedToken(address token) {
        require(authorizedTokens[token], "Token not authorized");
        _;
    }

    modifier onlyActiveVault(address token) {
        require(tokenVaults[token].isActive, "Vault not active");
        _;
    }

    modifier whenDepositsEnabled() {
        require(depositsEnabled && !emergencyMode, "Deposits disabled");
        _;
    }

    modifier whenWithdrawalsEnabled() {
        require(withdrawalsEnabled || emergencyMode, "Withdrawals disabled");
        _;
    }

    modifier whenYieldEnabled() {
        require(yieldHarvestingEnabled && !emergencyMode, "Yield harvesting disabled");
        _;
    }

    modifier validAmount(uint256 amount) {
        require(amount > 0, "Amount must be positive");
        _;
    }

    modifier notInEmergencyMode() {
        require(!emergencyMode, "Emergency mode active");
        _;
    }

    // ============================================================================
    // CONSTRUCTOR
    // ============================================================================

    constructor(
        address _admin,
        address _vaultManager,
        address _feeRecipient,
        address _treasury
    ) {
        require(_admin != address(0), "Invalid admin");
        require(_vaultManager != address(0), "Invalid vault manager");
        require(_feeRecipient != address(0), "Invalid fee recipient");
        require(_treasury != address(0), "Invalid treasury");

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(VAULT_MANAGER_ROLE, _vaultManager);
        _grantRole(YIELD_MANAGER_ROLE, _vaultManager);
        _grantRole(EMERGENCY_ROLE, _admin);

        feeRecipient = _feeRecipient;
        treasury = _treasury;

        // Default yield distribution: 70% users, 15% protocol, 10% LP incentives, 5% treasury
        yieldDistribution = YieldDistribution({
            userShare: 7000,
            protocolShare: 1500,
            lpIncentiveShare: 1000,
            treasuryShare: 500
        });
    }

    // ============================================================================
    // VAULT MANAGEMENT FUNCTIONS
    // ============================================================================

    /**
     * @dev Creates a new token vault
     */
    function createTokenVault(
        address token,
        uint256 maxDepositLimit,
        uint256 targetUtilizationBps,
        uint256 minWithdrawalAmount
    ) 
        external 
        onlyRole(VAULT_MANAGER_ROLE) 
        notInEmergencyMode
    {
        require(token != address(0), "Invalid token");
        require(!tokenVaults[token].isActive, "Vault already exists");
        require(targetUtilizationBps <= MAX_UTILIZATION_BPS, "Utilization too high");
        require(maxDepositLimit > 0, "Invalid deposit limit");

        tokenVaults[token] = TokenVault({
            token: token,
            totalDeposits: 0,
            totalWithdrawals: 0,
            availableBalance: 0,
            lockedBalance: 0,
            yieldGenerated: 0,
            lastRebalanceAt: block.timestamp,
            isActive: true,
            targetUtilizationBps: targetUtilizationBps,
            maxDepositLimit: maxDepositLimit,
            minWithdrawalAmount: minWithdrawalAmount
        });

        authorizedTokens[token] = true;
        supportedTokens.push(token);
        tokenMaxTvl[token] = maxDepositLimit;

        emit TokenVaultCreated(token, maxDepositLimit, targetUtilizationBps);
    }

    /**
     * @dev Adds a yield strategy for a token
     */
    function addYieldStrategy(
        address token,
        string memory strategyName,
        address strategyContract,
        uint256 targetAllocationBps,
        uint256 riskScore,
        uint256 minDeposit,
        uint256 maxDeposit
    ) 
        external 
        onlyRole(YIELD_MANAGER_ROLE) 
        onlyAuthorizedToken(token)
        notInEmergencyMode
    {
        require(strategyContract != address(0), "Invalid strategy contract");
        require(targetAllocationBps <= 10000, "Invalid allocation");
        require(riskScore >= 1 && riskScore <= 100, "Invalid risk score");
        require(tokenStrategies[token].length < MAX_YIELD_STRATEGIES, "Too many strategies");

        // Check if strategy already exists
        require(strategyIndexes[token][strategyName] == 0, "Strategy already exists");

        YieldStrategy memory newStrategy = YieldStrategy({
            strategyContract: strategyContract,
            name: strategyName,
            allocatedAmount: 0,
            targetAllocationBps: targetAllocationBps,
            currentYield: 0,
            lastHarvestAt: block.timestamp,
            isActive: true,
            riskScore: riskScore,
            minDeposit: minDeposit,
            maxDeposit: maxDeposit
        });

        tokenStrategies[token].push(newStrategy);
        strategyIndexes[token][strategyName] = tokenStrategies[token].length;

        emit StrategyAdded(token, strategyName, strategyContract, targetAllocationBps);
    }

    /**
     * @dev Removes a yield strategy
     */
    function removeYieldStrategy(
        address token,
        string memory strategyName
    ) 
        external 
        onlyRole(YIELD_MANAGER_ROLE) 
        onlyAuthorizedToken(token)
    {
        uint256 index = strategyIndexes[token][strategyName];
        require(index > 0, "Strategy not found");
        
        uint256 arrayIndex = index - 1;
        YieldStrategy storage strategy = tokenStrategies[token][arrayIndex];
        
        // Withdraw all funds from strategy before removal
        if (strategy.allocatedAmount > 0) {
            _withdrawFromStrategy(token, strategyName, strategy.allocatedAmount);
        }

        // Remove strategy from array
        uint256 lastIndex = tokenStrategies[token].length - 1;
        if (arrayIndex != lastIndex) {
            tokenStrategies[token][arrayIndex] = tokenStrategies[token][lastIndex];
            // Update index mapping for moved strategy
            strategyIndexes[token][tokenStrategies[token][arrayIndex].name] = index;
        }
        
        tokenStrategies[token].pop();
        delete strategyIndexes[token][strategyName];

        emit StrategyRemoved(token, strategyName);
    }

    // ============================================================================
    // DEPOSIT AND WITHDRAWAL FUNCTIONS
    // ============================================================================

    /**
     * @dev Deposits tokens into the vault
     */
    function deposit(
        address token,
        uint256 amount
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        whenDepositsEnabled
        onlyAuthorizedToken(token)
        onlyActiveVault(token)
        validAmount(amount)
    {
        TokenVault storage vault = tokenVaults[token];
        UserDeposit storage userDeposit = userDeposits[msg.sender][token];

        // Check deposit limits
        require(amount <= vault.maxDepositLimit, "Exceeds max deposit");
        require(vault.totalDeposits + amount <= tokenMaxTvl[token], "Exceeds TVL limit");
        require(userDeposit.amount + amount <= userMaxDeposit[msg.sender], "Exceeds user limit");

        // Transfer tokens from user
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // Update vault state
        vault.totalDeposits += amount;
        vault.availableBalance += amount;
        currentTotalValueLocked += amount;

        // Update user deposit
        if (userDeposit.amount == 0) {
            userDeposit.depositedAt = block.timestamp;
            userDeposit.lastYieldClaimAt = block.timestamp;
        }
        userDeposit.amount += amount;

        emit Deposited(msg.sender, token, amount, block.timestamp);

        // Auto-rebalance if needed
        _checkAndRebalance(token);
    }

    /**
     * @dev Withdraws tokens from the vault
     */
    function withdraw(
        address token,
        uint256 amount
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        whenWithdrawalsEnabled
        onlyAuthorizedToken(token)
        onlyActiveVault(token)
        validAmount(amount)
    {
        TokenVault storage vault = tokenVaults[token];
        UserDeposit storage userDeposit = userDeposits[msg.sender][token];

        require(userDeposit.amount >= amount, "Insufficient balance");
        require(amount >= vault.minWithdrawalAmount, "Below minimum withdrawal");
        require(!userDeposit.isLocked || block.timestamp >= userDeposit.lockExpiresAt, "Deposit locked");

        // Calculate withdrawal fee
        uint256 fee = (amount * withdrawalFeeBps) / 10000;
        uint256 netAmount = amount - fee;

        // Ensure sufficient liquidity
        if (vault.availableBalance < amount) {
            _rebalanceForWithdrawal(token, amount);
        }
        require(vault.availableBalance >= amount, "Insufficient liquidity");

        // Update vault state
        vault.totalWithdrawals += amount;
        vault.availableBalance -= amount;
        currentTotalValueLocked -= amount;

        // Update user deposit
        userDeposit.amount -= amount;

        // Transfer tokens to user
        IERC20(token).safeTransfer(msg.sender, netAmount);
        if (fee > 0) {
            IERC20(token).safeTransfer(feeRecipient, fee);
        }

        emit Withdrawn(msg.sender, token, netAmount, fee, block.timestamp);
    }

    /**
     * @dev Emergency withdrawal with higher fees
     */
    function emergencyWithdraw(
        address token,
        uint256 amount
    ) 
        external 
        nonReentrant 
        onlyAuthorizedToken(token)
        validAmount(amount)
    {
        UserDeposit storage userDeposit = userDeposits[msg.sender][token];
        require(userDeposit.amount >= amount, "Insufficient balance");

        // Calculate emergency withdrawal fee
        uint256 fee = (amount * emergencyWithdrawalFeeBps) / 10000;
        uint256 netAmount = amount - fee;

        // Force withdrawal from strategies if needed
        _forceWithdrawalFromStrategies(token, amount);

        // Update state
        TokenVault storage vault = tokenVaults[token];
        vault.totalWithdrawals += amount;
        vault.availableBalance -= amount;
        currentTotalValueLocked -= amount;
        userDeposit.amount -= amount;

        // Transfer tokens
        IERC20(token).safeTransfer(msg.sender, netAmount);
        if (fee > 0) {
            IERC20(token).safeTransfer(feeRecipient, fee);
        }

        emit EmergencyWithdrawal(msg.sender, token, netAmount, fee);
    }

    // ============================================================================
    // YIELD MANAGEMENT FUNCTIONS
    // ============================================================================

    /**
     * @dev Harvests yield from all strategies for a token
     */
    function harvestYield(address token) 
        external 
        nonReentrant 
        whenNotPaused 
        whenYieldEnabled
        onlyAuthorizedToken(token)
        onlyRole(YIELD_MANAGER_ROLE)
    {
        YieldStrategy[] storage strategies = tokenStrategies[token];
        uint256 totalHarvested = 0;

        for (uint256 i = 0; i < strategies.length; i++) {
            if (strategies[i].isActive && strategies[i].allocatedAmount > 0) {
                uint256 harvested = _harvestFromStrategy(token, i);
                totalHarvested += harvested;
                strategies[i].currentYield += harvested;
                strategies[i].lastHarvestAt = block.timestamp;

                emit YieldHarvested(
                    token,
                    strategies[i].name,
                    harvested,
                    block.timestamp
                );
            }
        }

        if (totalHarvested > 0) {
            TokenVault storage vault = tokenVaults[token];
            vault.yieldGenerated += totalHarvested;
            vault.availableBalance += totalHarvested;
            totalYieldGenerated += totalHarvested;

            _distributeYield(token, totalHarvested);
        }
    }

    /**
     * @dev Distributes yield according to the distribution parameters
     */
    function _distributeYield(address token, uint256 totalYield) internal {
        uint256 userShare = (totalYield * yieldDistribution.userShare) / 10000;
        uint256 protocolShare = (totalYield * yieldDistribution.protocolShare) / 10000;
        uint256 lpIncentiveShare = (totalYield * yieldDistribution.lpIncentiveShare) / 10000;
        uint256 treasuryShare = (totalYield * yieldDistribution.treasuryShare) / 10000;

        // Transfer protocol fees
        if (protocolShare > 0) {
            IERC20(token).safeTransfer(feeRecipient, protocolShare);
        }

        // Transfer treasury share
        if (treasuryShare > 0) {
            IERC20(token).safeTransfer(treasury, treasuryShare);
        }

        // LP incentive share remains in vault for distribution
        // User share is distributed proportionally to deposits

        totalYieldDistributed += totalYield;
    }

    /**
     * @dev Claims accumulated yield for a user
     */
    function claimYield(address token) 
        external 
        nonReentrant 
        whenNotPaused 
        onlyAuthorizedToken(token)
    {
        UserDeposit storage userDeposit = userDeposits[msg.sender][token];
        require(userDeposit.amount > 0, "No deposits");

        uint256 claimableYield = _calculateClaimableYield(msg.sender, token);
        require(claimableYield > 0, "No yield to claim");

        userDeposit.accumulatedYield = 0;
        userDeposit.lastYieldClaimAt = block.timestamp;

        IERC20(token).safeTransfer(msg.sender, claimableYield);

        emit YieldDistributed(msg.sender, token, claimableYield, block.timestamp);
    }

    /**
     * @dev Calculates claimable yield for a user
     */
    function _calculateClaimableYield(address user, address token) internal view returns (uint256) {
        UserDeposit storage userDeposit = userDeposits[user][token];
        TokenVault storage vault = tokenVaults[token];

        if (userDeposit.amount == 0 || vault.totalDeposits == 0) {
            return 0;
        }

        // Calculate user's share of total yield
        uint256 userShare = (userDeposit.amount * vault.yieldGenerated) / vault.totalDeposits;
        uint256 userYieldShare = (userShare * yieldDistribution.userShare) / 10000;

        return userYieldShare + userDeposit.accumulatedYield;
    }

    // ============================================================================
    // REBALANCING FUNCTIONS
    // ============================================================================

    /**
     * @dev Rebalances token allocation across yield strategies
     */
    function rebalance(address token) 
        external 
        nonReentrant 
        whenNotPaused 
        whenYieldEnabled
        onlyAuthorizedToken(token)
        onlyRole(YIELD_MANAGER_ROLE)
    {
        _performRebalance(token);
    }

    /**
     * @dev Internal rebalancing logic
     */
    function _performRebalance(address token) internal {
        TokenVault storage vault = tokenVaults[token];
        YieldStrategy[] storage strategies = tokenStrategies[token];

        uint256 totalAvailable = vault.availableBalance;
        uint256 targetUtilization = (totalAvailable * vault.targetUtilizationBps) / 10000;

        // Calculate target allocations
        uint256 totalTargetBps = 0;
        for (uint256 i = 0; i < strategies.length; i++) {
            if (strategies[i].isActive) {
                totalTargetBps += strategies[i].targetAllocationBps;
            }
        }

        if (totalTargetBps == 0) return;

        // Rebalance each strategy
        for (uint256 i = 0; i < strategies.length; i++) {
            if (strategies[i].isActive) {
                uint256 targetAmount = (targetUtilization * strategies[i].targetAllocationBps) / totalTargetBps;
                uint256 currentAmount = strategies[i].allocatedAmount;

                if (targetAmount > currentAmount) {
                    // Need to deposit more
                    uint256 depositAmount = targetAmount - currentAmount;
                    if (depositAmount <= vault.availableBalance) {
                        _depositToStrategy(token, i, depositAmount);
                    }
                } else if (targetAmount < currentAmount) {
                    // Need to withdraw
                    uint256 withdrawAmount = currentAmount - targetAmount;
                    _withdrawFromStrategy(token, strategies[i].name, withdrawAmount);
                }
            }
        }

        vault.lastRebalanceAt = block.timestamp;
        emit Rebalanced(token, totalAvailable, block.timestamp);
    }

    /**
     * @dev Checks if rebalancing is needed and performs it
     */
    function _checkAndRebalance(address token) internal {
        TokenVault storage vault = tokenVaults[token];
        
        // Check if rebalancing is needed based on threshold
        uint256 timeSinceLastRebalance = block.timestamp - vault.lastRebalanceAt;
        uint256 utilizationDrift = _calculateUtilizationDrift(token);

        if (timeSinceLastRebalance >= 1 hours || utilizationDrift >= REBALANCE_THRESHOLD_BPS) {
            _performRebalance(token);
        }
    }

    /**
     * @dev Calculates utilization drift from target
     */
    function _calculateUtilizationDrift(address token) internal view returns (uint256) {
        TokenVault storage vault = tokenVaults[token];
        if (vault.availableBalance == 0) return 0;

        uint256 currentUtilization = ((vault.availableBalance - vault.lockedBalance) * 10000) / vault.availableBalance;
        uint256 targetUtilization = vault.targetUtilizationBps;

        return currentUtilization > targetUtilization 
            ? currentUtilization - targetUtilization 
            : targetUtilization - currentUtilization;
    }

    /**
     * @dev Rebalances for withdrawal by pulling funds from strategies
     */
    function _rebalanceForWithdrawal(address token, uint256 neededAmount) internal {
        TokenVault storage vault = tokenVaults[token];
        uint256 shortfall = neededAmount - vault.availableBalance;

        YieldStrategy[] storage strategies = tokenStrategies[token];
        
        // Withdraw from strategies starting with lowest yield
        for (uint256 i = 0; i < strategies.length && shortfall > 0; i++) {
            if (strategies[i].isActive && strategies[i].allocatedAmount > 0) {
                uint256 withdrawAmount = shortfall.min(strategies[i].allocatedAmount);
                _withdrawFromStrategy(token, strategies[i].name, withdrawAmount);
                shortfall -= withdrawAmount;
            }
        }
    }

    /**
     * @dev Forces withdrawal from all strategies (emergency)
     */
    function _forceWithdrawalFromStrategies(address token, uint256 neededAmount) internal {
        YieldStrategy[] storage strategies = tokenStrategies[token];
        uint256 remaining = neededAmount;

        for (uint256 i = 0; i < strategies.length && remaining > 0; i++) {
            if (strategies[i].allocatedAmount > 0) {
                uint256 withdrawAmount = remaining.min(strategies[i].allocatedAmount);
                _withdrawFromStrategy(token, strategies[i].name, withdrawAmount);
                remaining -= withdrawAmount;
            }
        }
    }

    // ============================================================================
    // STRATEGY INTERACTION FUNCTIONS
    // ============================================================================

    /**
     * @dev Deposits tokens to a specific strategy
     */
    function _depositToStrategy(address token, uint256 strategyIndex, uint256 amount) internal {
        YieldStrategy storage strategy = tokenStrategies[token][strategyIndex];
        TokenVault storage vault = tokenVaults[token];

        require(amount >= strategy.minDeposit, "Below minimum deposit");
        require(strategy.allocatedAmount + amount <= strategy.maxDeposit, "Exceeds max deposit");

        // Transfer tokens to strategy contract
        IERC20(token).safeTransfer(strategy.strategyContract, amount);

        // Update state
        strategy.allocatedAmount += amount;
        vault.availableBalance -= amount;
        vault.lockedBalance += amount;

        // Call strategy contract deposit function
        (bool success,) = strategy.strategyContract.call(
            abi.encodeWithSignature("deposit(address,uint256)", token, amount)
        );
        require(success, "Strategy deposit failed");
    }

    /**
     * @dev Withdraws tokens from a specific strategy
     */
    function _withdrawFromStrategy(address token, string memory strategyName, uint256 amount) internal {
        uint256 index = strategyIndexes[token][strategyName];
        require(index > 0, "Strategy not found");

        YieldStrategy storage strategy = tokenStrategies[token][index - 1];
        TokenVault storage vault = tokenVaults[token];

        require(strategy.allocatedAmount >= amount, "Insufficient strategy balance");

        // Call strategy contract withdraw function
        (bool success,) = strategy.strategyContract.call(
            abi.encodeWithSignature("withdraw(address,uint256)", token, amount)
        );
        require(success, "Strategy withdrawal failed");

        // Update state
        strategy.allocatedAmount -= amount;
        vault.lockedBalance -= amount;
        vault.availableBalance += amount;
    }

    /**
     * @dev Harvests yield from a specific strategy
     */
    function _harvestFromStrategy(address token, uint256 strategyIndex) internal returns (uint256) {
        YieldStrategy storage strategy = tokenStrategies[token][strategyIndex];

        uint256 balanceBefore = IERC20(token).balanceOf(address(this));

        // Call strategy contract harvest function
        (bool success,) = strategy.strategyContract.call(
            abi.encodeWithSignature("harvest(address)", token)
        );
        require(success, "Strategy harvest failed");

        uint256 balanceAfter = IERC20(token).balanceOf(address(this));
        return balanceAfter - balanceBefore;
    }

    // ============================================================================
    // ADMIN FUNCTIONS
    // ============================================================================

    /**
     * @dev Updates yield distribution parameters
     */
    function updateYieldDistribution(
        uint256 userShare,
        uint256 protocolShare,
        uint256 lpIncentiveShare,
        uint256 treasuryShare
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(userShare + protocolShare + lpIncentiveShare + treasuryShare == 10000, "Invalid distribution");

        yieldDistribution = YieldDistribution({
            userShare: userShare,
            protocolShare: protocolShare,
            lpIncentiveShare: lpIncentiveShare,
            treasuryShare: treasuryShare
        });

        emit YieldDistributionUpdated(userShare, protocolShare, lpIncentiveShare, treasuryShare);
    }

    /**
     * @dev Updates protocol fees
     */
    function updateFees(
        uint256 _protocolFeeBps,
        uint256 _withdrawalFeeBps,
        uint256 _emergencyWithdrawalFeeBps
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_protocolFeeBps <= 1000, "Protocol fee too high");
        require(_withdrawalFeeBps <= 500, "Withdrawal fee too high");
        require(_emergencyWithdrawalFeeBps <= 1000, "Emergency fee too high");

        protocolFeeBps = _protocolFeeBps;
        withdrawalFeeBps = _withdrawalFeeBps;
        emergencyWithdrawalFeeBps = _emergencyWithdrawalFeeBps;
    }

    /**
     * @dev Updates risk parameters for a token
     */
    function updateRiskParameters(
        address token,
        uint256 riskScore,
        uint256 maxTvl,
        uint256 targetUtilization
    ) external onlyRole(DEFAULT_ADMIN_ROLE) onlyAuthorizedToken(token) {
        require(riskScore >= 1 && riskScore <= 100, "Invalid risk score");
        require(targetUtilization <= MAX_UTILIZATION_BPS, "Invalid utilization");

        tokenRiskScores[token] = riskScore;
        tokenMaxTvl[token] = maxTvl;
        tokenVaults[token].targetUtilizationBps = targetUtilization;

        emit RiskParametersUpdated(token, riskScore, maxTvl);
    }

    /**
     * @dev Enables/disables vault operations
     */
    function setOperationStatus(
        bool _depositsEnabled,
        bool _withdrawalsEnabled,
        bool _yieldHarvestingEnabled
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        depositsEnabled = _depositsEnabled;
        withdrawalsEnabled = _withdrawalsEnabled;
        yieldHarvestingEnabled = _yieldHarvestingEnabled;
    }

    /**
     * @dev Activates emergency mode
     */
    function activateEmergencyMode() external onlyRole(EMERGENCY_ROLE) {
        emergencyMode = true;
        depositsEnabled = false;
        yieldHarvestingEnabled = false;
        _pause();
    }

    /**
     * @dev Deactivates emergency mode
     */
    function deactivateEmergencyMode() external onlyRole(EMERGENCY_ROLE) {
        emergencyMode = false;
        depositsEnabled = true;
        withdrawalsEnabled = true;
        yieldHarvestingEnabled = true;
        _unpause();
    }

    // ============================================================================
    // VIEW FUNCTIONS
    // ============================================================================

    /**
     * @dev Gets vault information for a token
     */
    function getVaultInfo(address token) external view returns (
        uint256 totalDeposits,
        uint256 totalWithdrawals,
        uint256 availableBalance,
        uint256 lockedBalance,
        uint256 yieldGenerated,
        uint256 targetUtilizationBps,
        bool isActive
    ) {
        TokenVault storage vault = tokenVaults[token];
        return (
            vault.totalDeposits,
            vault.totalWithdrawals,
            vault.availableBalance,
            vault.lockedBalance,
            vault.yieldGenerated,
            vault.targetUtilizationBps,
            vault.isActive
        );
    }

    /**
     * @dev Gets user deposit information
     */
    function getUserDeposit(address user, address token) external view returns (
        uint256 amount,
        uint256 depositedAt,
        uint256 lastYieldClaimAt,
        uint256 claimableYield,
        bool isLocked,
        uint256 lockExpiresAt
    ) {
        UserDeposit storage deposit = userDeposits[user][token];
        return (
            deposit.amount,
            deposit.depositedAt,
            deposit.lastYieldClaimAt,
            _calculateClaimableYield(user, token),
            deposit.isLocked,
            deposit.lockExpiresAt
        );
    }

    /**
     * @dev Gets all strategies for a token
     */
    function getTokenStrategies(address token) external view returns (YieldStrategy[] memory) {
        return tokenStrategies[token];
    }

    /**
     * @dev Gets vault statistics
     */
    function getVaultStats() external view returns (
        uint256 _totalYieldGenerated,
        uint256 _totalYieldDistributed,
        uint256 _currentTotalValueLocked,
        uint256 _totalSupportedTokens,
        bool _emergencyMode
    ) {
        return (
            totalYieldGenerated,
            totalYieldDistributed,
            currentTotalValueLocked,
            supportedTokens.length,
            emergencyMode
        );
    }

    /**
     * @dev Gets supported tokens list
     */
    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokens;
    }

    // ============================================================================
    // EMERGENCY FUNCTIONS
    // ============================================================================

    /**
     * @dev Emergency token recovery
     */
    function emergencyRecoverTokens(
        address token,
        address to,
        uint256 amount
    ) external onlyRole(EMERGENCY_ROLE) {
        require(emergencyMode, "Not in emergency mode");
        IERC20(token).safeTransfer(to, amount);
    }

    /**
     * @dev Emergency strategy withdrawal
     */
    function emergencyWithdrawFromStrategy(
        address token,
        string memory strategyName
    ) external onlyRole(EMERGENCY_ROLE) {
        uint256 index = strategyIndexes[token][strategyName];
        require(index > 0, "Strategy not found");

        YieldStrategy storage strategy = tokenStrategies[token][index - 1];
        if (strategy.allocatedAmount > 0) {
            _withdrawFromStrategy(token, strategyName, strategy.allocatedAmount);
        }
    }
}