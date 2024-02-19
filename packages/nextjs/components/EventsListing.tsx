"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import EventCard from "./EventCard";
import { Loading } from "@web3uikit/core";
import { mainnet } from "wagmi";
import Web3 from "web3";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import scaffoldConfig from "~~/scaffold.config";

export const EventsListing: React.FC = () => {
  const [blockTimestamp, setBlockTimestamp] = useState<number>(0);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [endedEvents, setEndedEvents] = useState<any[]>([]);

  const {
    data: eventCreatedEvent,
    isLoading: isLoadingEventCreatedEvent,
    error: errorEventCreatedEvent,
  } = useScaffoldEventHistory({
    contractName: "EventManager",
    eventName: "EventCreated",
    fromBlock: scaffoldConfig.fromBlock,
    watch: true,
  });

  useEffect(() => {
    const web3 = new Web3(`${mainnet.rpcUrls.alchemy.http[0]}/${scaffoldConfig.alchemyApiKey}`);
    web3.eth.getBlock("latest").then(async (block: any) => {
      setBlockTimestamp(Number(block.timestamp));
    });
  }, []);

  useEffect(() => {
    if (eventCreatedEvent) {
      const upcomingEventsArray: any[] = [];
      const endedEventsArray: any[] = [];

      eventCreatedEvent.forEach((event: any) => {
        if (event.args.time > blockTimestamp) {
          upcomingEventsArray.push(event);
        } else {
          endedEventsArray.push(event);
        }
      });

      setUpcomingEvents(upcomingEventsArray);
      setEndedEvents(endedEventsArray);
    }
  }, [eventCreatedEvent, blockTimestamp]);

  if (isLoadingEventCreatedEvent) {
    return <Loading />;
  }

  if (errorEventCreatedEvent) {
    return <div>Error</div>;
  }

  return (
    <div>
      <p className="font-bold text-3xl text-center">Events Listing</p>
      <p className=" text-2xl text-center">Upcoming Events</p>
      <div className="flex flex-row">
        {upcomingEvents.map((event, index) => (
          <Link key={index} href={`/events/${event.args.eventId}`}>
            <EventCard key={index} event={event.args} />
          </Link>
        ))}
      </div>

      <p className="text-2xl text-center">Ended Events</p>
      <div className="flex flex-row">
        {endedEvents.map((event, index) => (
          <Link key={index} href={`/events/${event.args.eventId}`}>
            <EventCard key={index} event={event.args} />
          </Link>
        ))}
      </div>
    </div>
  );
};
