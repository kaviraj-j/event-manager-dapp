//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";


/**
 * This contract is a event managing contract
 * @author Kaviraj
 */


contract EventManager is ReentrancyGuard {
    struct TicketType {
        uint256 price;
        uint256 totalQuantity;
        uint256 availableQuantity;
    }

    struct Event {
        string name;
        string description;
        string location;
        uint256 time;
        bool isCancelled;
        address organizer;
    }

    // eventId => Event
    mapping(uint256 => Event) public events;
    // eventId => ticketTypeName => TicketType
    mapping(uint256 => mapping(string => TicketType)) public ticketTypes;
    // organizer => list of their events' ids
    mapping(address => uint256[]) private organizerEvents;
    // userId => eventId => ticketTypeName => quantity
    mapping(address => mapping(uint256 => mapping(string => uint256))) public ticketOwnership;
    // eventId => ticketTypeNameArray
    mapping(uint256 => string[]) eventTicketTypes;

    uint256 private nextEventId;

    event EventCreated(uint256 eventId, string name, string description, string location, uint256 time, address organizer);
    event TicketTypeAdded(uint256 eventId, string ticketType, uint256 price, uint256 quantity);
    event TicketPurchased(address buyer, uint256 eventId, string ticketType, uint256 quantity);
    event TicketCancelled(address holder, uint256 eventId, string ticketType, uint256 quantity);
    event EventCancelled(uint256 eventId);

    modifier onlyOrganizer(uint256 eventId) {
        require(events[eventId].organizer == msg.sender, "You are not the organizer of this event.");
        _;
    }
    
    modifier eventExists(uint256 eventId) {
        require(bytes(events[eventId].name).length > 0, "The event does not exist.");
        _;
    }

    modifier notCancelled(uint256 eventId) {
        require(!events[eventId].isCancelled, "The event is cancelled.");
        _;
    }

    function createEvent(string memory name, string memory description, string memory location, uint256 time) public {
        require(time > block.timestamp, "Event time must be in the future.");

        uint256 eventId = nextEventId++;
        events[eventId] = Event(name, description, location, time, false, msg.sender);
        organizerEvents[msg.sender].push(eventId);

        emit EventCreated(eventId, name, description, location, time, msg.sender);
    }

    function addTicketType(uint256 eventId, string memory ticketType, uint256 price, uint256 quantity) public onlyOrganizer(eventId) eventExists(eventId) {
        require(price > 0, "Price must be greater than zero.");
        require(quantity > 0, "Quantity must be greater than zero.");

        ticketTypes[eventId][ticketType] = TicketType(price, quantity, quantity);
        eventTicketTypes[eventId].push(ticketType);

        emit TicketTypeAdded(eventId, ticketType, price, quantity);
    }

    function buyTicket(uint256 eventId, string memory ticketType, uint256 quantity) public payable notCancelled(eventId) eventExists(eventId) nonReentrant {
        TicketType storage t = ticketTypes[eventId][ticketType];
        require(quantity > 0 && quantity <= t.availableQuantity, "Not enough tickets available.");
        require(msg.value == t.price * quantity, "Incorrect amount of ether sent.");

        ticketOwnership[msg.sender][eventId][ticketType] += quantity;
        t.availableQuantity -= quantity;

        emit TicketPurchased(msg.sender, eventId, ticketType, quantity);
    }

    function cancelTicket(uint256 eventId, string memory ticketType, uint256 quantity) public nonReentrant {
        require(ticketOwnership[msg.sender][eventId][ticketType] >= quantity, "You do not own enough tickets to cancel.");
        TicketType storage t = ticketTypes[eventId][ticketType];

        ticketOwnership[msg.sender][eventId][ticketType] -= quantity;
        t.availableQuantity += quantity;

        uint256 refundAmount = t.price * quantity;
        payable(msg.sender).transfer(refundAmount);

        emit TicketCancelled(msg.sender, eventId, ticketType, quantity);
    }

    function cancelEvent(uint256 eventId) public onlyOrganizer(eventId) notCancelled(eventId) eventExists(eventId) {
        events[eventId].isCancelled = true;
        emit EventCancelled(eventId);
    }

    function getOrganizerEvents(address organizer) public view returns (uint256[] memory) {
        return organizerEvents[organizer];
    }
    
}