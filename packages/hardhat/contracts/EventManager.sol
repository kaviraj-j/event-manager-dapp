// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * This contract is an event managing contract
 * @author Kaviraj
 */
contract EventManager is ReentrancyGuard {
	struct TicketType {
		uint256 price;
		uint256 totalQuantity;
		uint256 availableQuantity;
	}
	struct Ticket {
		uint256 eventId;
		string ticketType;
		uint256 quantity;
	}

	struct Event {
		uint256 eventId;
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
	mapping(address => mapping(uint256 => mapping(string => uint256)))
		public ticketOwnership;
	// eventId => ticketTypeNameArray
	mapping(uint256 => string[]) eventTicketTypes;
	mapping(address => Ticket[]) public userTickets;

	uint256 private nextEventId;

	event EventCreated(
		uint256 indexed eventId,
		string name,
		string description,
		string location,
		uint256 time,
		address organizer
	);
	event TicketTypeAdded(
		uint256 indexed eventId,
		string ticketType,
		uint256 price,
		uint256 quantity
	);
	event TicketPurchased(
		address indexed buyer,
		uint256 indexed eventId,
		string ticketType,
		uint256 quantity
	);
	event TicketCancelled(
		address indexed holder,
		uint256 indexed eventId,
		string ticketType,
		uint256 quantity
	);
	event EventCancelled(uint256 indexed eventId);

	modifier onlyOrganizer(uint256 eventId) {
		require(
			events[eventId].organizer == msg.sender,
			"You are not the organizer of this event."
		);
		_;
	}

	modifier eventExists(uint256 eventId) {
		require(
			bytes(events[eventId].name).length > 0,
			"The event does not exist."
		);
		_;
	}

	modifier notCancelled(uint256 eventId) {
		require(!events[eventId].isCancelled, "The event is cancelled.");
		_;
	}

	function createEvent(
		string memory name,
		string memory description,
		string memory location,
		uint256 time
	) public {
		require(time > block.timestamp, "Event time must be in the future.");

		uint256 eventId = nextEventId++;
		events[eventId] = Event(
			eventId,
			name,
			description,
			location,
			time,
			false,
			msg.sender
		);
		organizerEvents[msg.sender].push(eventId);

		emit EventCreated(
			eventId,
			name,
			description,
			location,
			time,
			msg.sender
		);
	}

	function addTicketType(
		uint256 eventId,
		string memory ticketType,
		uint256 price,
		uint256 quantity
	) public onlyOrganizer(eventId) eventExists(eventId) {
		require(price > 0, "Price must be greater than zero.");
		require(quantity > 0, "Quantity must be greater than zero.");

		ticketTypes[eventId][ticketType] = TicketType(
			price,
			quantity,
			quantity
		);
		eventTicketTypes[eventId].push(ticketType);

		emit TicketTypeAdded(eventId, ticketType, price, quantity);
	}

	function buyTicket(
		uint256 eventId,
		string memory ticketType,
		uint256 quantity
	) public payable notCancelled(eventId) eventExists(eventId) nonReentrant {
		TicketType storage t = ticketTypes[eventId][ticketType];
		require(
			quantity > 0 && quantity <= t.availableQuantity,
			"Not enough tickets available."
		);
		require(
			msg.value == t.price * quantity,
			"Incorrect amount of ether sent."
		);

		// ticketOwnership[msg.sender][eventId][ticketType] += quantity;
		t.availableQuantity -= quantity;
		userTickets[msg.sender].push(
			Ticket({
				eventId: eventId,
				ticketType: ticketType,
				quantity: quantity
			})
		);

		emit TicketPurchased(msg.sender, eventId, ticketType, quantity);
	}

	function cancelTicket(
    uint256 eventId,
    string memory ticketType,
    uint256 quantity
) public nonReentrant {
    (uint256 userTicketIndex, bool isPresent) = getUserTicketIndex(eventId, ticketType);
    require(isPresent, "You do not own enough tickets to cancel.");

    Ticket storage userTicket = userTickets[msg.sender][userTicketIndex];
    require(userTicket.quantity >= quantity, "You do not own enough tickets to cancel.");

    // Event storage eventInfo = events[eventId];
    TicketType storage ticketTypeInfo = ticketTypes[eventId][ticketType];

    userTicket.quantity -= quantity;
    ticketTypeInfo.availableQuantity += quantity;

    uint256 refundAmount = ticketTypeInfo.price * quantity;
    payable(msg.sender).transfer(refundAmount);

    emit TicketCancelled(msg.sender, eventId, ticketType, quantity);
}

function getUserTicketIndex(uint256 eventId, string memory ticketType) internal view returns (uint256, bool) {
    Ticket[] storage tickets = userTickets[msg.sender];
    for (uint256 i = 0; i < tickets.length; i++) {
        if (tickets[i].eventId == eventId && keccak256(bytes(tickets[i].ticketType)) == keccak256(bytes(ticketType))) {
            return (i, true);
        }
    }
    return (0, false);
}


	function withdrawFunds(uint256 eventId) public onlyOrganizer(eventId) {
		require(
			events[eventId].time < block.timestamp,
			"The event has not ended yet."
		);
		require(
			events[eventId].isCancelled == false,
			"The event is cancelled."
		);

		uint256 totalAmount = 0;
		string[] memory ticketTypesArray = eventTicketTypes[eventId];

		for (uint256 i = 0; i < ticketTypesArray.length; i++) {
			string memory ticketType = ticketTypesArray[i];
			TicketType storage ticket = ticketTypes[eventId][ticketType];
			uint256 ticketsSold = ticket.totalQuantity -
				ticket.availableQuantity;
			totalAmount += ticketsSold * ticket.price;
		}

		require(totalAmount > 0, "No funds available for withdrawal.");

		// Transfer funds to the organizer
		payable(msg.sender).transfer(totalAmount);
	}

	function cancelEvent(
		uint256 eventId
	) public onlyOrganizer(eventId) notCancelled(eventId) eventExists(eventId) {
		events[eventId].isCancelled = true;
		emit EventCancelled(eventId);
	}

	function getEventTicketDetails(
		uint256 eventId
	)
		public
		view
		eventExists(eventId)
		returns (
			string[] memory,
			uint256[] memory,
			uint256[] memory,
			uint256[] memory
		)
	{
		string[] memory ticketTypesArray = eventTicketTypes[eventId];
		uint256 numTicketTypes = ticketTypesArray.length;

		uint256[] memory prices = new uint256[](numTicketTypes);
		uint256[] memory totalQuantities = new uint256[](numTicketTypes);
		uint256[] memory availableQuantities = new uint256[](numTicketTypes);

		for (uint256 i = 0; i < numTicketTypes; i++) {
			string memory ticketType = ticketTypesArray[i];
			TicketType storage ticket = ticketTypes[eventId][ticketType];
			prices[i] = ticket.price;
			totalQuantities[i] = ticket.totalQuantity;
			availableQuantities[i] = ticket.availableQuantity;
		}

		return (ticketTypesArray, prices, totalQuantities, availableQuantities);
	}

	function getOrganizerEvents(
		address organizer
	) public view returns (Event[] memory) {
		uint256[] memory organizerEventsIdArray = organizerEvents[organizer];
		Event[] memory organizerEventsArray = new Event[](
			organizerEventsIdArray.length
		);

		for (uint256 i = 0; i < organizerEventsIdArray.length; i++) {
			uint256 eventId = organizerEventsIdArray[i];
			organizerEventsArray[i] = events[eventId];
		}

		return (organizerEventsArray);
	}

	function getUserTickets(
		address userAddress
	) public view returns (Ticket[] memory) {
		return userTickets[userAddress];
	}
}
