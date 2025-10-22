// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title BenefitsManagement
 * @dev Smart contract pour gérer les bénéfices échangeables contre des tokens APX
 * Système complémentaire pour permettre aux utilisateurs de dépenser leurs APX
 */
contract BenefitsManagement is Ownable, ReentrancyGuard {
    using Strings for uint256;
    
    IERC20 public immutable apxToken;
    uint256 private _orderCounter;
    
    struct Benefit {
        uint256 priceAPX;           // Prix en APX tokens (en wei)
        string title;               // "1:1 with the Creator (Aiden P2P)"
        string description;         // Phrase de valeur
        string mechanics;           // Mécanique en 1 ligne
        string guardrails;          // Garde-fous et limites
        string tokenomics;          // Badge tokenomics ("100% burn", "gasless")
        string iconName;            // Nom de l'icône Lucide React
        string colorClass;          // Classe CSS pour la couleur
        bool isActive;              // Bénéfice disponible
        uint256 totalRedeemed;      // Nombre total de rachats
        uint256 maxRedemptions;     // Limite globale (0 = illimité)
        uint256 createdAt;          // Timestamp de création
    }
    
    struct Redemption {
        address user;               // Adresse de l'utilisateur
        bytes32 benefitId;          // ID du bénéfice
        uint256 apxBurned;          // Montant APX brûlé
        uint256 timestamp;          // Date de rachat
        string orderId;             // ID unique de commande
        bytes32 contactHash;        // Hash pour lien email (optionnel)
        bool isProcessed;           // Traité par l'équipe
        bool contactSubmitted;      // Contact email soumis
    }
    
    // Mapping des bénéfices par ID
    mapping(bytes32 => Benefit) public benefits;
    
    // Vérification si un utilisateur a déjà racheté un bénéfice
    mapping(address => mapping(bytes32 => bool)) public userRedeemed;
    
    // Historique des rachats par Order ID
    mapping(string => Redemption) public redemptions;
    
    // Mapping pour récupérer les rachats par utilisateur
    mapping(address => string[]) public userOrderIds;
    
    // Liste des bénéfices actifs
    bytes32[] public activeBenefitIds;
    
    // Statistiques globales
    uint256 public totalAPXBurned;
    uint256 public totalRedemptions;
    
    // Events
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
    
    constructor(address _apxToken, address _owner) Ownable(_owner) {
        require(_apxToken != address(0), "Invalid APX token address");
        require(_owner != address(0), "Invalid owner address");
        
        apxToken = IERC20(_apxToken);
        _orderCounter = 0;
        totalAPXBurned = 0;
        totalRedemptions = 0;
    }
    
    /**
     * @dev Crée un nouveau bénéfice (admin seulement)
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
     * @dev Met à jour un bénéfice existant
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
     * @dev Racheter un bénéfice avec burn APX
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
        
        // Vérifier limite globale
        if (benefit.maxRedemptions > 0) {
            require(benefit.totalRedeemed < benefit.maxRedemptions, "Max redemptions reached");
        }
        
        // Vérifier balance utilisateur
        require(apxToken.balanceOf(msg.sender) >= benefit.priceAPX, "Insufficient APX balance");
        
        // Générer Order ID unique
        _orderCounter++;
        orderId = string(abi.encodePacked("BEN-", block.timestamp.toString(), "-", _orderCounter.toString()));
        
        // Burn les tokens APX
        require(apxToken.transferFrom(msg.sender, address(this), benefit.priceAPX), "APX transfer failed");
        _burnAPX(benefit.priceAPX, string(abi.encodePacked("Benefit redeemed: ", orderId)));
        
        // Enregistrer le rachat
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
        
        // Marquer comme racheté pour cet utilisateur
        userRedeemed[msg.sender][benefitId] = true;
        userOrderIds[msg.sender].push(orderId);
        
        // Mettre à jour les statistiques
        benefit.totalRedeemed++;
        totalRedemptions++;
        totalAPXBurned += benefit.priceAPX;
        
        emit BenefitRedeemed(msg.sender, benefitId, benefit.priceAPX, orderId, block.timestamp);
        
        return orderId;
    }
    
    /**
     * @dev Soumettre le hash de contact après rachat
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
    
    /**
     * @dev Marquer un rachat comme traité
     */
    function markAsProcessed(string memory orderId) external onlyOwner {
        require(bytes(redemptions[orderId].orderId).length > 0, "Order does not exist");
        require(!redemptions[orderId].isProcessed, "Already processed");
        
        redemptions[orderId].isProcessed = true;
        
        emit BenefitProcessed(orderId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Brûler les tokens APX
     */
    function _burnAPX(uint256 amount, string memory reason) internal {
        // Approche simple: transfer vers 0x0 (burn address)
        require(apxToken.transfer(address(0), amount), "Burn failed");
        
        emit APXBurned(msg.sender, amount, reason);
    }
    
    // ===== FONCTIONS VIEW =====
    
    /**
     * @dev Récupérer les détails d'un bénéfice
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
     * @dev Vérifier si un utilisateur peut racheter un bénéfice
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
     * @dev Récupérer tous les bénéfices actifs
     */
    function getActiveBenefits() external view returns (bytes32[] memory) {
        uint256 count = 0;
        
        // Compter les bénéfices actifs
        for (uint256 i = 0; i < activeBenefitIds.length; i++) {
            if (benefits[activeBenefitIds[i]].isActive) {
                count++;
            }
        }
        
        // Créer le tableau de résultats
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
     * @dev Récupérer les rachats d'un utilisateur
     */
    function getUserRedemptions(address user) external view returns (string[] memory) {
        return userOrderIds[user];
    }
    
    /**
     * @dev Récupérer les détails d'un rachat
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
     * @dev Statistiques globales
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
    
    /**
     * @dev Initialiser les bénéfices prédéfinis (triés par prix croissant)
     */
    function initializePredefinedBenefits() external onlyOwner {
        // Early Access Beta - 500 APX
        createBenefit(
            0x6265746161636365737300000000000000000000000000000000000000000000, // "betaaccess"
            500 * 10**18, // 500 APX
            "Early Access to the Beta",
            "Priority access to the next product release.",
            "Redeem with APX -> allowlist your wallet for Beta features.",
            "Limit: 1 per wallet, permanent access",
            "APX burn",
            "Zap",
            "bg-gradient-to-r from-blue-500 to-cyan-500",
            100
        );
        
        // USDC Voucher - 1000 APX
        createBenefit(
            0x757364637663686572000000000000000000000000000000000000000000000, // "usdcvcher"
            1000 * 10**18, // 1000 APX
            "10 USDC Voucher",
            "A 10 USDC credit delivered to your wallet.",
            "Redeem with APX -> on-chain event -> USDC payout (server-fulfilled) within 24-48h.",
            "Limit: 1 per wallet, payout within 48h",
            "APX burn",
            "DollarSign",
            "bg-gradient-to-r from-green-500 to-emerald-500",
            10
        );
        
        // 1:1 with Creator - 1500 APX
        createBenefit(
            0x316f6e31000000000000000000000000000000000000000000000000000000, // "1on1"
            1500 * 10**18, // 1500 APX
            "1:1 with the Creator (Aiden P2P)",
            "A 30-45 min private session to discuss product, token design, Base integration, or GTM.",
            "Redeem with APX -> on-chain receipt -> booking link sent.",
            "Limit: 1 per wallet, expires in 30 days",
            "APX burn",
            "UserCheck",
            "bg-gradient-to-r from-purple-500 to-pink-500",
            10
        );
        
        // Lucky Draw - 2000 APX
        createBenefit(
            0x6c75636b796472617700000000000000000000000000000000000000000000, // "luckydraw"
            2000 * 10**18, // 2000 APX
            "Lucky Draw — Win 100 USDC",
            "Entry into a raffle for 100 USDC.",
            "Redeem with APX -> on-chain entry logged; transparent draw (tx hash / VRF if added).",
            "Limit: 1 per wallet, draw monthly",
            "APX burn",
            "Gift",
            "bg-gradient-to-r from-yellow-500 to-orange-500",
            500
        );
    }
    
    /**
     * @dev Retrait d'urgence des tokens APX (au cas où)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = apxToken.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        require(apxToken.transfer(owner(), balance), "Emergency withdraw failed");
    }
}