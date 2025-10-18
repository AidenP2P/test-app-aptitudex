# Smart Contract ClaimDistributor - Code pour Remix

## 📄 ClaimDistributor.sol

Voici le code complet optimisé pour Remix IDE :

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }
    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}

abstract contract Ownable is Context {
    address private _owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        _transferOwnership(_msgSender());
    }

    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    function _checkOwner() internal view virtual {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
    }

    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner);
    }

    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
    }

    function _nonReentrantAfter() private {
        _status = _NOT_ENTERED;
    }

    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == _ENTERED;
    }
}

/**
 * @title ClaimDistributor
 * @dev Smart contract pour distribuer des tokens APX via des claims daily/weekly
 * Supporte les streaks avec bonus progressifs et optimisé pour les transactions gasless
 */
contract ClaimDistributor is Ownable, ReentrancyGuard {
    IERC20 public immutable apxToken;
    
    struct ClaimConfig {
        uint256 dailyAmount;     // Base daily reward en wei
        uint256 weeklyAmount;    // Base weekly reward en wei
        uint256 maxStreakDays;   // Maximum streak days
        bool enabled;            // Claims enabled/disabled
    }
    
    struct UserClaim {
        uint256 lastDailyClaim;      // Timestamp du dernier claim daily
        uint256 lastWeeklyClaim;     // Timestamp du dernier claim weekly
        uint256 currentDailyStreak;  // Streak daily actuel
        uint256 currentWeeklyStreak; // Streak weekly actuel
        uint256 totalDailyClaims;    // Total des claims daily
        uint256 totalWeeklyClaims;   // Total des claims weekly
        uint256 lifetimeAPXClaimed;  // Total APX claimé à vie
    }
    
    struct StreakMultiplier {
        uint256 threshold;  // Seuil de streak requis
        uint256 multiplier; // Multiplicateur en basis points (10000 = 100%)
    }
    
    // Configuration principale
    ClaimConfig public claimConfig;
    
    // Données utilisateur
    mapping(address => UserClaim) public userClaims;
    
    // Multiplicateurs de streak
    StreakMultiplier[] public dailyStreakMultipliers;
    StreakMultiplier[] public weeklyStreakMultipliers;
    
    // Constantes
    uint256 public constant COOLDOWN_DAILY = 24 hours;
    uint256 public constant COOLDOWN_WEEKLY = 7 days;
    uint256 public constant GRACE_PERIOD = 2 hours;
    uint256 public constant BASIS_POINTS = 10000;
    
    // Events
    event DailyClaimed(address indexed user, uint256 amount, uint256 streak, uint256 bonusPercent);
    event WeeklyClaimed(address indexed user, uint256 amount, uint256 streak, uint256 bonusPercent);
    event ConfigUpdated(uint256 dailyAmount, uint256 weeklyAmount, bool enabled);
    event Provisioned(address indexed admin, uint256 amount, uint256 newBalance);
    event StreakMultiplierUpdated(bool isDaily, uint256 threshold, uint256 multiplier);
    event EmergencyWithdraw(address indexed admin, uint256 amount);
    
    constructor(address _apxToken) {
        require(_apxToken != address(0), "Invalid APX token address");
        
        apxToken = IERC20(_apxToken);
        
        // Configuration initiale
        claimConfig = ClaimConfig({
            dailyAmount: 10 * 10**18,  // 10 APX
            weeklyAmount: 100 * 10**18, // 100 APX
            maxStreakDays: 365,
            enabled: true
        });
        
        // Multiplicateurs de streak daily
        dailyStreakMultipliers.push(StreakMultiplier(7, 12000));   // 20% bonus à 7 jours
        dailyStreakMultipliers.push(StreakMultiplier(30, 15000));  // 50% bonus à 30 jours
        dailyStreakMultipliers.push(StreakMultiplier(100, 20000)); // 100% bonus à 100 jours
        
        // Multiplicateurs de streak weekly
        weeklyStreakMultipliers.push(StreakMultiplier(4, 12500));  // 25% bonus à 4 semaines
        weeklyStreakMultipliers.push(StreakMultiplier(12, 15000)); // 50% bonus à 12 semaines
        weeklyStreakMultipliers.push(StreakMultiplier(52, 20000)); // 100% bonus à 52 semaines
    }
    
    /**
     * @dev Claim daily reward
     */
    function claimDaily() external nonReentrant {
        require(claimConfig.enabled, "Claims disabled");
        UserClaim storage user = userClaims[msg.sender];
        
        // Vérification cooldown
        require(
            user.lastDailyClaim == 0 || 
            block.timestamp >= user.lastDailyClaim + COOLDOWN_DAILY,
            "Daily cooldown not met"
        );
        
        // Calcul du nouveau streak
        uint256 newStreak = _updateDailyStreak(user);
        
        // Calcul du reward avec bonus
        uint256 reward = _calculateDailyReward(newStreak);
        uint256 bonusPercent = _calculateBonusPercent(newStreak, dailyStreakMultipliers);
        
        // Vérification des fonds du contract
        require(apxToken.balanceOf(address(this)) >= reward, "Insufficient contract balance");
        
        // Mise à jour des données utilisateur
        user.lastDailyClaim = block.timestamp;
        user.currentDailyStreak = newStreak;
        user.totalDailyClaims += 1;
        user.lifetimeAPXClaimed += reward;
        
        // Transfer des tokens
        require(apxToken.transfer(msg.sender, reward), "Transfer failed");
        
        emit DailyClaimed(msg.sender, reward, newStreak, bonusPercent);
    }
    
    /**
     * @dev Claim weekly reward
     */
    function claimWeekly() external nonReentrant {
        require(claimConfig.enabled, "Claims disabled");
        UserClaim storage user = userClaims[msg.sender];
        
        // Vérification cooldown
        require(
            user.lastWeeklyClaim == 0 || 
            block.timestamp >= user.lastWeeklyClaim + COOLDOWN_WEEKLY,
            "Weekly cooldown not met"
        );
        
        // Calcul du nouveau streak
        uint256 newStreak = _updateWeeklyStreak(user);
        
        // Calcul du reward avec bonus
        uint256 reward = _calculateWeeklyReward(newStreak);
        uint256 bonusPercent = _calculateBonusPercent(newStreak, weeklyStreakMultipliers);
        
        // Vérification des fonds du contract
        require(apxToken.balanceOf(address(this)) >= reward, "Insufficient contract balance");
        
        // Mise à jour des données utilisateur
        user.lastWeeklyClaim = block.timestamp;
        user.currentWeeklyStreak = newStreak;
        user.totalWeeklyClaims += 1;
        user.lifetimeAPXClaimed += reward;
        
        // Transfer des tokens
        require(apxToken.transfer(msg.sender, reward), "Transfer failed");
        
        emit WeeklyClaimed(msg.sender, reward, newStreak, bonusPercent);
    }
    
    /**
     * @dev Provisionne le contract avec des tokens APX (admin seulement)
     */
    function provision(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(apxToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        uint256 newBalance = apxToken.balanceOf(address(this));
        emit Provisioned(msg.sender, amount, newBalance);
    }
    
    /**
     * @dev Met à jour la configuration des rewards (admin seulement)
     */
    function updateConfig(uint256 _dailyAmount, uint256 _weeklyAmount, bool _enabled) external onlyOwner {
        require(_dailyAmount > 0, "Daily amount must be greater than 0");
        require(_weeklyAmount > 0, "Weekly amount must be greater than 0");
        
        claimConfig.dailyAmount = _dailyAmount;
        claimConfig.weeklyAmount = _weeklyAmount;
        claimConfig.enabled = _enabled;
        
        emit ConfigUpdated(_dailyAmount, _weeklyAmount, _enabled);
    }
    
    /**
     * @dev Toggle l'état des claims (admin seulement)
     */
    function toggleClaims() external onlyOwner {
        claimConfig.enabled = !claimConfig.enabled;
        emit ConfigUpdated(claimConfig.dailyAmount, claimConfig.weeklyAmount, claimConfig.enabled);
    }
    
    /**
     * @dev Retrait d'urgence des fonds (admin seulement)
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        uint256 balance = apxToken.balanceOf(address(this));
        require(amount <= balance, "Insufficient balance");
        require(apxToken.transfer(msg.sender, amount), "Transfer failed");
        
        emit EmergencyWithdraw(msg.sender, amount);
    }
    
    // ===== FONCTIONS VIEW =====
    
    /**
     * @dev Vérifie si l'utilisateur peut claim daily
     */
    function canClaimDaily(address user) external view returns (bool) {
        if (!claimConfig.enabled) return false;
        
        UserClaim memory userClaim = userClaims[user];
        return userClaim.lastDailyClaim == 0 || 
               block.timestamp >= userClaim.lastDailyClaim + COOLDOWN_DAILY;
    }
    
    /**
     * @dev Vérifie si l'utilisateur peut claim weekly
     */
    function canClaimWeekly(address user) external view returns (bool) {
        if (!claimConfig.enabled) return false;
        
        UserClaim memory userClaim = userClaims[user];
        return userClaim.lastWeeklyClaim == 0 || 
               block.timestamp >= userClaim.lastWeeklyClaim + COOLDOWN_WEEKLY;
    }
    
    /**
     * @dev Retourne les prochains temps de claim
     */
    function getNextClaimTimes(address user) external view returns (uint256 nextDaily, uint256 nextWeekly) {
        UserClaim memory userClaim = userClaims[user];
        
        if (userClaim.lastDailyClaim > 0) {
            nextDaily = userClaim.lastDailyClaim + COOLDOWN_DAILY;
        }
        
        if (userClaim.lastWeeklyClaim > 0) {
            nextWeekly = userClaim.lastWeeklyClaim + COOLDOWN_WEEKLY;
        }
    }
    
    /**
     * @dev Calcule les montants de reward pour l'utilisateur
     */
    function getRewardAmounts(address user) external view returns (uint256 dailyReward, uint256 weeklyReward) {
        UserClaim memory userClaim = userClaims[user];
        
        uint256 projectedDailyStreak = _calculateProjectedDailyStreak(userClaim);
        uint256 projectedWeeklyStreak = _calculateProjectedWeeklyStreak(userClaim);
        
        dailyReward = _calculateDailyReward(projectedDailyStreak);
        weeklyReward = _calculateWeeklyReward(projectedWeeklyStreak);
    }
    
    /**
     * @dev Retourne les pourcentages de bonus pour l'utilisateur
     */
    function getBonusPercentages(address user) external view returns (uint256 dailyBonus, uint256 weeklyBonus) {
        UserClaim memory userClaim = userClaims[user];
        
        uint256 projectedDailyStreak = _calculateProjectedDailyStreak(userClaim);
        uint256 projectedWeeklyStreak = _calculateProjectedWeeklyStreak(userClaim);
        
        dailyBonus = _calculateBonusPercent(projectedDailyStreak, dailyStreakMultipliers);
        weeklyBonus = _calculateBonusPercent(projectedWeeklyStreak, weeklyStreakMultipliers);
    }
    
    /**
     * @dev Retourne le balance du contract
     */
    function getContractBalance() external view returns (uint256) {
        return apxToken.balanceOf(address(this));
    }
    
    /**
     * @dev Retourne les multiplicateurs de streak
     */
    function getStreakMultipliers(bool isDaily) external view returns (StreakMultiplier[] memory) {
        return isDaily ? dailyStreakMultipliers : weeklyStreakMultipliers;
    }
    
    // ===== FONCTIONS INTERNES =====
    
    function _updateDailyStreak(UserClaim storage user) internal returns (uint256) {
        if (user.lastDailyClaim == 0) return 1;
        
        uint256 timeSinceLastClaim = block.timestamp - user.lastDailyClaim;
        
        if (timeSinceLastClaim <= COOLDOWN_DAILY + GRACE_PERIOD) {
            return user.currentDailyStreak + 1;
        } else {
            return 1; // Reset du streak
        }
    }
    
    function _updateWeeklyStreak(UserClaim storage user) internal returns (uint256) {
        if (user.lastWeeklyClaim == 0) return 1;
        
        uint256 timeSinceLastClaim = block.timestamp - user.lastWeeklyClaim;
        
        if (timeSinceLastClaim <= COOLDOWN_WEEKLY + GRACE_PERIOD) {
            return user.currentWeeklyStreak + 1;
        } else {
            return 1; // Reset du streak
        }
    }
    
    function _calculateDailyReward(uint256 streak) internal view returns (uint256) {
        uint256 baseReward = claimConfig.dailyAmount;
        uint256 multiplier = BASIS_POINTS;
        
        for (uint i = 0; i < dailyStreakMultipliers.length; i++) {
            if (streak >= dailyStreakMultipliers[i].threshold) {
                multiplier = dailyStreakMultipliers[i].multiplier;
            }
        }
        
        return (baseReward * multiplier) / BASIS_POINTS;
    }
    
    function _calculateWeeklyReward(uint256 streak) internal view returns (uint256) {
        uint256 baseReward = claimConfig.weeklyAmount;
        uint256 multiplier = BASIS_POINTS;
        
        for (uint i = 0; i < weeklyStreakMultipliers.length; i++) {
            if (streak >= weeklyStreakMultipliers[i].threshold) {
                multiplier = weeklyStreakMultipliers[i].multiplier;
            }
        }
        
        return (baseReward * multiplier) / BASIS_POINTS;
    }
    
    function _calculateBonusPercent(uint256 streak, StreakMultiplier[] storage multipliers) internal view returns (uint256) {
        uint256 multiplier = BASIS_POINTS;
        
        for (uint i = 0; i < multipliers.length; i++) {
            if (streak >= multipliers[i].threshold) {
                multiplier = multipliers[i].multiplier;
            }
        }
        
        if (multiplier > BASIS_POINTS) {
            return ((multiplier - BASIS_POINTS) * 100) / BASIS_POINTS;
        }
        
        return 0;
    }
    
    function _calculateProjectedDailyStreak(UserClaim memory userClaim) internal view returns (uint256) {
        if (userClaim.lastDailyClaim == 0) return 1;
        
        uint256 timeSinceLastClaim = block.timestamp - userClaim.lastDailyClaim;
        
        if (block.timestamp < userClaim.lastDailyClaim + COOLDOWN_DAILY) {
            return userClaim.currentDailyStreak; // Pas encore temps de claim
        }
        
        if (timeSinceLastClaim <= COOLDOWN_DAILY + GRACE_PERIOD) {
            return userClaim.currentDailyStreak + 1;
        } else {
            return 1; // Streak serait reseté
        }
    }
    
    function _calculateProjectedWeeklyStreak(UserClaim memory userClaim) internal view returns (uint256) {
        if (userClaim.lastWeeklyClaim == 0) return 1;
        
        uint256 timeSinceLastClaim = block.timestamp - userClaim.lastWeeklyClaim;
        
        if (block.timestamp < userClaim.lastWeeklyClaim + COOLDOWN_WEEKLY) {
            return userClaim.currentWeeklyStreak; // Pas encore temps de claim
        }
        
        if (timeSinceLastClaim <= COOLDOWN_WEEKLY + GRACE_PERIOD) {
            return userClaim.currentWeeklyStreak + 1;
        } else {
            return 1; // Streak serait reseté
        }
    }
}
```

## 🚀 Instructions de déploiement via Remix

### Étape 1: Préparer Remix
1. Ouvrir [Remix IDE](https://remix.ethereum.org/)
2. Créer un nouveau fichier `ClaimDistributor.sol`
3. Copier-coller le code ci-dessus

### Étape 2: Compilation
1. **Compiler** → Solidity Compiler
2. **Version**: `0.8.19+`
3. **Optimization**: Activé (200 runs)
4. Cliquer sur **Compile**

### Étape 3: Déploiement sur Base
1. **Deploy & Run** → Environment: Injected Provider - MetaMask
2. **Network**: Base Mainnet (8453)
3. **Constructor Parameters**:
   - `_apxToken`: `0x1A51B19BC7b...` (adresse de votre token APX)
4. Cliquer sur **Deploy**

### Étape 4: Vérification
1. **Copy** l'adresse du contract déployé
2. Vérifier sur [BaseScan](https://basescan.org/)
3. **Verify Contract** avec le code source

## 📋 Paramètres de déploiement

**Constructor:**
- `_apxToken`: Adresse de votre token APX existant

**Configuration initiale:**
- Daily reward: `10 APX`
- Weekly reward: `100 APX`
- Claims: `Enabled`
- Streak multipliers: Préconfigurés

## ⚠️ Important après déploiement

1. **Noter l'adresse** du contract déployé
2. **Mettre à jour** `src/config/claimDistributor.ts` avec cette adresse
3. **Provisionner** le contract avec des tokens APX
4. **Tester** les fonctions basic avant la mise en production

Une fois déployé, on passe à l'étape 2: Configuration Paymaster Coinbase !