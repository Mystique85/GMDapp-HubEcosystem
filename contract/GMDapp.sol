/**
 *Submitted for verification at celoscan.io on 2025-10-20
*/

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface AggregatorV3Interface {
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
}

contract GMDapp {
    AggregatorV3Interface public priceFeed;
    uint256 public constant USD_FEE = 0.01 * 1e18;
    address public constant FEE_RECEIVER = 0xd30286180E142628cc437624Ea4160d5450F73D6;
    
    struct User {
        uint256 streak;
        uint256 totalGM;
        uint256 lastTimestamp;
    }

    mapping(address => User) public users;

    event GMSent(address indexed user, uint256 streak, uint256 totalGM, uint256 ethPaid);

    constructor(address _priceFeed) {
        priceFeed = AggregatorV3Interface(_priceFeed);
    }

    function sayGM() external payable {
        uint256 requiredFee = getGmFee();
        require(msg.value >= requiredFee, "Insufficient fee");

        User storage user = users[msg.sender];

        if (block.timestamp - user.lastTimestamp > 1 days) {
            user.streak = 0;
        }

        user.streak += 1;
        user.totalGM += 1;
        user.lastTimestamp = block.timestamp;

        (bool success, ) = FEE_RECEIVER.call{value: requiredFee}("");
        require(success, "Fee transfer failed");

        if (msg.value > requiredFee) {
            payable(msg.sender).transfer(msg.value - requiredFee);
        }

        emit GMSent(msg.sender, user.streak, user.totalGM, requiredFee);
    }

    function getGmFee() public view returns (uint256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price feed");
        
        uint256 ethPrice = uint256(price) * 1e10;
        uint256 feeInWei = (USD_FEE * 1e18) / ethPrice;
        
        return feeInWei;
    }

    function getEthPrice() public view returns (uint256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return uint256(price);
    }

    function getUserStats(address userAddr) external view returns (uint256 streak, uint256 totalGM, uint256 lastTimestamp) {
        User memory user = users[userAddr];
        return (user.streak, user.totalGM, user.lastTimestamp);
    }

    function setPriceFeed(address _priceFeed) external {
        require(msg.sender == FEE_RECEIVER, "Only fee receiver can update");
        priceFeed = AggregatorV3Interface(_priceFeed);
    }

    function withdraw() external {
        require(msg.sender == FEE_RECEIVER, "Only fee receiver can withdraw");
        payable(FEE_RECEIVER).transfer(address(this).balance);
    }
}