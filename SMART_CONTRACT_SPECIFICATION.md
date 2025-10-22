# 📜 Smart Contract BenefitsManagement - Specification

## Contract Overview

The **BenefitsManagement** Smart Contract is the main backend of the Benefits system. It manages the creation, purchase, and tracking of benefits with APX token burning.

## 🏗️ Contract Architecture

### Imports and Inheritance

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract BenefitsManagement is Ownable, ReentrancyGuard {
    using Strings for uint256;
    
    IERC20 public immutable apxToken;
    uint256 private _orderCounter;
    
    // ... structures et mappings
}
```

### Data Structures

```solidity
struct Benefit {
    uint256 priceAPX;           // Price in APX tokens (in wei)
    string title;               // "1:1 with the Creator (Aiden P2P)"
    string description;         // Value proposition
    string mechanics;           // Mechanics in one line
    string guardrails;          // Guardrails and limits
    string tokenomics;          // Tokenomics badge ("100% burn", "gasless")
    string iconName;            // Lucide React icon name
    string colorClass;          // CSS color class
    bool isActive;              // Benefit available
    uint256 totalRedeemed;      // Total number of redemptions
    uint256 maxRedemptions;     // Global limit (0 = unlimited)
    uint256 createdAt;          // Creation timestamp
}

struct Redemption {
    address user;               // User address
    bytes32 benefitId;          // Benefit ID
    uint256 apxBurned;          // APX amount burned
    uint256 timestamp;          // Redemption date
    string orderId;             // Unique order ID
    bytes32 contactHash;        // Hash for email link (optional)
    bool isProcessed;           // Processed by team
    bool contactSubmitted;      // Email contact submitted
}
```

### Mappings and Storage

```solidity
// Mapping of benefits by ID
mapping(bytes32 => Benefit) public benefits;

// Check if a user has already redeemed a benefit
mapping(address => mapping(bytes32 => bool)) public userRedeemed;

// Redemption history by Order ID
mapping(string => Redemption) public redemptions;

// Mapping to retrieve redemptions by user
mapping(address => string[]) public userOrderIds;

// List of active benefits
bytes32[] public activeBenefitIds;

// Global statistics
uint256 public totalAPXBurned;
uint256 public totalRedemptions;
```

### Events

```solidity
event BenefitCreated(
    bytes32 indexed benefitId,
    uint256 priceAPX,
    string title,
    address indexed creator
);

event BenefitUpdated(
    bytes32 indexed benefitId,
    uint256 newPriceAPX,
    bool isActive,
    address indexed updater
);

event BenefitRedeemed(
    address indexed user,
    bytes32 indexed benefitId,
    uint256 apxBurned,
    string orderId,
    uint256 timestamp
);

event ContactSubmitted(
    string indexed orderId,
    bytes32 contactHash,
    address indexed user
);

event BenefitProcessed(
    string indexed orderId,
    address indexed processor,
    uint256 timestamp
);

event APXBurned(
    address indexed user,
    uint256 amount,
    string reason
);
```

## 🛠️ Main Functions

### Admin Functions

```solidity
/**
 * @dev Create a new benefit (admin only)
 * @param benefitId Unique benefit identifier
 * @param priceAPX Price in APX tokens (in wei)
 * @param title Benefit title
 * @param description Description/value proposition
 * @param mechanics Mechanics in one line
 * @param guardrails Guardrails and limits
 * @param tokenomics Tokenomics badge
 * @param iconName Lucide icon name
 * @param colorClass CSS color class
 * @param maxRedemptions Global limit (0 = unlimited)
 */
function createBenefit(
    bytes32 benefitId,
    uint256 priceAPX,
    string memory title,
    string memory description,
    string memory mechanics,
    string memory guardrails,
    string memory tokenomics,
    string memory iconName,
    string memory colorClass,
    uint256 maxRedemptions
) external onlyOwner {
    require(benefits[benefitId].priceAPX == 0, "Benefit already exists");
    require(priceAPX > 0, "Price must be greater than 0");
    require(bytes(title).length > 0, "Title required");
    
    benefits[benefitId] = Benefit({
        priceAPX: priceAPX,
        title: title,
        description: description,
        mechanics: mechanics,
        guardrails: guardrails,
        tokenomics: tokenomics,
        iconName: iconName,
        colorClass: colorClass,
        isActive: true,
        totalRedeemed: 0,
        maxRedemptions: maxRedemptions,
        createdAt: block.timestamp
    });
    
    activeBenefitIds.push(benefitId);
    
    emit BenefitCreated(benefitId, priceAPX, title, msg.sender);
}

/**
 * @dev Update an existing benefit
 */
function updateBenefit(
    bytes32 benefitId,
    uint256 newPriceAPX,
    string memory newTitle,
    string memory newDescription,
    bool isActive
) external onlyOwner {
    require(benefits[benefitId].priceAPX > 0, "Benefit does not exist");
    
    Benefit storage benefit = benefits[benefitId];
    benefit.priceAPX = newPriceAPX;
    benefit.title = newTitle;
    benefit.description = newDescription;
    benefit.isActive = isActive;
    
    emit BenefitUpdated(benefitId, newPriceAPX, isActive, msg.sender);
}

/**
 * @dev Mark a redemption as processed
 */
function markAsProcessed(string memory orderId) external onlyOwner {
    require(bytes(redemptions[orderId].orderId).length > 0, "Order does not exist");
    require(!redemptions[orderId].isProcessed, "Already processed");
    
    redemptions[orderId].isProcessed = true;
    
    emit BenefitProcessed(orderId, msg.sender, block.timestamp);
}
```

### User Functions

```solidity
/**
 * @dev Redeem a benefit with APX burn
 * @param benefitId ID of the benefit to redeem
 * @return orderId Unique order ID
 */
function redeemBenefit(bytes32 benefitId)
    external
    nonReentrant
    returns (string memory orderId)
{
    Benefit storage benefit = benefits[benefitId];
    
    // Validations
    require(benefit.priceAPX > 0, "Benefit does not exist");
    require(benefit.isActive, "Benefit is not active");
    require(!userRedeemed[msg.sender][benefitId], "Already redeemed by user");
    
    // Check global limit
    if (benefit.maxRedemptions > 0) {
        require(benefit.totalRedeemed < benefit.maxRedemptions, "Max redemptions reached");
    }
    
    // Check user balance
    require(apxToken.balanceOf(msg.sender) >= benefit.priceAPX, "Insufficient APX balance");
    
    // Generate unique Order ID
    _orderCounter++;
    orderId = string(abi.encodePacked("BEN-", block.timestamp.toString(), "-", _orderCounter.toString()));
    
    // Burn APX tokens
    require(apxToken.transferFrom(msg.sender, address(this), benefit.priceAPX), "APX transfer failed");
    _burnAPX(benefit.priceAPX, string(abi.encodePacked("Benefit redeemed: ", orderId)));
    
    // Record the redemption
    redemptions[orderId] = Redemption({
        user: msg.sender,
        benefitId: benefitId,
        apxBurned: benefit.priceAPX,
        timestamp: block.timestamp,
        orderId: orderId,
        contactHash: bytes32(0),
        isProcessed: false,
        contactSubmitted: false
    });
    
    // Mark as redeemed for this user
    userRedeemed[msg.sender][benefitId] = true;
    userOrderIds[msg.sender].push(orderId);
    
    // Update statistics
    benefit.totalRedeemed++;
    totalRedemptions++;
    totalAPXBurned += benefit.priceAPX;
    
    emit BenefitRedeemed(msg.sender, benefitId, benefit.priceAPX, orderId, block.timestamp);
    
    return orderId;
}

/**
 * @dev Submit contact hash after redemption
 * @param orderId Order ID
 * @param contactHash Email contact hash
 */
function submitContactHash(string memory orderId, bytes32 contactHash) external {
    Redemption storage redemption = redemptions[orderId];
    
    require(redemption.user == msg.sender, "Not your order");
    require(!redemption.contactSubmitted, "Contact already submitted");
    require(contactHash != bytes32(0), "Invalid contact hash");
    
    redemption.contactHash = contactHash;
    redemption.contactSubmitted = true;
    
    emit ContactSubmitted(orderId, contactHash, msg.sender);
}
```

### View Functions

```solidity
/**
 * @dev Get benefit details
 */
function getBenefitDetails(bytes32 benefitId) 
    external 
    view 
    returns (
        uint256 priceAPX,
        string memory title,
        string memory description,
        string memory mechanics,
        string memory guardrails,
        string memory tokenomics,
        string memory iconName,
        string memory colorClass,
        bool isActive,
        uint256 totalRedeemed,
        uint256 maxRedemptions
    ) 
{
    Benefit storage benefit = benefits[benefitId];
    return (
        benefit.priceAPX,
        benefit.title,
        benefit.description,
        benefit.mechanics,
        benefit.guardrails,
        benefit.tokenomics,
        benefit.iconName,
        benefit.colorClass,
        benefit.isActive,
        benefit.totalRedeemed,
        benefit.maxRedemptions
    );
}

/**
 * @dev Check if a user can redeem a benefit
 */
function canRedeemBenefit(address user, bytes32 benefitId) external view returns (bool) {
    Benefit storage benefit = benefits[benefitId];
    
    if (benefit.priceAPX == 0 || !benefit.isActive) return false;
    if (userRedeemed[user][benefitId]) return false;
    if (benefit.maxRedemptions > 0 && benefit.totalRedeemed >= benefit.maxRedemptions) return false;
    if (apxToken.balanceOf(user) < benefit.priceAPX) return false;
    
    return true;
}

/**
 * @dev Get all active benefits
 */
function getActiveBenefits() external view returns (bytes32[] memory) {
    uint256 count = 0;
    
    // Count active benefits
    for (uint256 i = 0; i < activeBenefitIds.length; i++) {
        if (benefits[activeBenefitIds[i]].isActive) {
            count++;
        }
    }
    
    // Create results array
    bytes32[] memory activeBenefits = new bytes32[](count);
    uint256 index = 0;
    
    for (uint256 i = 0; i < activeBenefitIds.length; i++) {
        if (benefits[activeBenefitIds[i]].isActive) {
            activeBenefits[index] = activeBenefitIds[i];
            index++;
        }
    }
    
    return activeBenefits;
}

/**
 * @dev Get user redemptions
 */
function getUserRedemptions(address user) external view returns (string[] memory) {
    return userOrderIds[user];
}

/**
 * @dev Get redemption details
 */
function getRedemptionDetails(string memory orderId) 
    external 
    view 
    returns (
        address user,
        bytes32 benefitId,
        uint256 apxBurned,
        uint256 timestamp,
        bool isProcessed,
        bool contactSubmitted
    ) 
{
    Redemption storage redemption = redemptions[orderId];
    return (
        redemption.user,
        redemption.benefitId,
        redemption.apxBurned,
        redemption.timestamp,
        redemption.isProcessed,
        redemption.contactSubmitted
    );
}

/**
 * @dev Global statistics
 */
function getGlobalStats() external view returns (
    uint256 totalBurned,
    uint256 totalRedemptionsCount,
    uint256 activeBenefitsCount
) {
    uint256 activeCount = 0;
    for (uint256 i = 0; i < activeBenefitIds.length; i++) {
        if (benefits[activeBenefitIds[i]].isActive) {
            activeCount++;
        }
    }
    
    return (totalAPXBurned, totalRedemptions, activeCount);
}
```

### Internal Functions

```solidity
/**
 * @dev Brûler les tokens APX
 */
function _burnAPX(uint256 amount, string memory reason) internal {
    // Approche simple: transfer vers 0x0 (burn address)
    require(apxToken.transfer(address(0), amount), "Burn failed");
    
    emit APXBurned(msg.sender, amount, reason);
}

/**
 * @dev Générer un hash de contact simple
 */
function _generateContactHash(string memory email, string memory orderId) 
    internal 
    pure 
    returns (bytes32) 
{
    return keccak256(abi.encodePacked(email, orderId, "BENEFIT_CONTACT"));
}
```

## 🎯 Bénéfices Prédéfinis pour Initialisation

```solidity
// Fonction d'initialisation appelée après déploiement
function initializePredefinedBenefits() external onlyOwner {
    // 1:1 with Creator
    createBenefit(
        0x316f6e31000000000000000000000000000000000000000000000000000000, // "1on1"
        5000 * 10**18, // 5000 APX
        "1:1 with the Creator (Aiden P2P)",
        "A 30–45 min private session to discuss product, token design, Base integration, or GTM.",
        "Redeem with APX → on-chain receipt → booking link sent.",
        "Limit: 1 per wallet, expires in 30 days",
        "100% burn",
        "UserCheck",
        "bg-gradient-to-r from-purple-500 to-pink-500",
        10
    );
    
    // Early Access Beta
    createBenefit(
        0x6265746161636365737300000000000000000000000000000000000000000000, // "betaaccess"
        1000 * 10**18, // 1000 APX
        "Early Access to the Beta",
        "Priority access to the next product release.",
        "Redeem with APX → allowlist your wallet for Beta features.",
        "Limit: 1 per wallet, permanent access",
        "100% burn + gasless",
        "Zap",
        "bg-gradient-to-r from-blue-500 to-cyan-500",
        100
    );
    
    // USDC Voucher
    createBenefit(
        0x757364637663686572000000000000000000000000000000000000000000000, // "usdcvcher"
        2000 * 10**18, // 2000 APX
        "10 USDC Voucher",
        "A 10 USDC credit delivered to your wallet.",
        "Redeem with APX → on-chain event → USDC payout (server-fulfilled) within 24–48h.",
        "Limit: 1 per wallet, payout within 48h",
        "100% burn + gasless",
        "DollarSign",
        "bg-gradient-to-r from-green-500 to-emerald-500",
        50
    );
    
    // Lucky Draw
    createBenefit(
        0x6c75636b796472617700000000000000000000000000000000000000000000, // "luckydraw"
        500 * 10**18, // 500 APX
        "Lucky Draw — Win 100 USDC",
        "Entry into a raffle for 100 USDC.",
        "Redeem with APX → on-chain entry logged; transparent draw (tx hash / VRF if added).",
        "Limit: 1 per wallet, draw monthly",
        "100% burn + gasless",
        "Gift",
        "bg-gradient-to-r from-yellow-500 to-orange-500",
        0 // Illimité
    );
}
```

## 🔒 Sécurité et Validations

### Modifiers Personnalisés

```solidity
modifier validBenefit(bytes32 benefitId) {
    require(benefits[benefitId].priceAPX > 0, "Benefit does not exist");
    _;
}

modifier onlyBenefitOwner(string memory orderId) {
    require(redemptions[orderId].user == msg.sender, "Not your order");
    _;
}
```

### Fonctions d'Urgence

```solidity
/**
 * @dev Retrait d'urgence des tokens APX (au cas où)
 */
function emergencyWithdraw() external onlyOwner {
    uint256 balance = apxToken.balanceOf(address(this));
    require(balance > 0, "No tokens to withdraw");
    require(apxToken.transfer(owner(), balance), "Emergency withdraw failed");
}

/**
 * @dev Pause d'urgence des rachats
 */
bool public emergencyPaused = false;

function setEmergencyPause(bool paused) external onlyOwner {
    emergencyPaused = paused;
}

modifier whenNotPaused() {
    require(!emergencyPaused, "Contract is paused");
    _;
}
```

## 📊 Gas Optimization

- Utilisation de `bytes32` pour les IDs de bénéfices
- Mapping optimisés pour éviter les boucles
- Events indexés pour filtrage efficace
- Structures packed quand possible

## 🎯 Constructor

```solidity
constructor(address _apxToken, address _owner) Ownable(_owner) {
    require(_apxToken != address(0), "Invalid APX token address");
    require(_owner != address(0), "Invalid owner address");
    
    apxToken = IERC20(_apxToken);
    _orderCounter = 0;
    totalAPXBurned = 0;
    totalRedemptions = 0;
}
```

This complete specification defines the BenefitsManagement Smart Contract architecture with all required functionalities for the Benefits system.
