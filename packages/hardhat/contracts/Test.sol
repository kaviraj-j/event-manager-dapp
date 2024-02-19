//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract Test {
    uint256 favoriteNumber = 20;
    event ChangedNumber(uint256 favoriteNumber);

    function greet() public pure returns(uint256) {
        return 10;
    }

    function changeFavoriteNumber(uint256 _number) public {
        favoriteNumber = _number;
        emit ChangedNumber(favoriteNumber);
    }
}