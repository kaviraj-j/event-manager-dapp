"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Loading } from "@web3uikit/core";
import { useAccount } from "wagmi";
import EventCard from "~~/components/EventCard";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";

const Page = () => {
  const [myEvents, setMyEvents] = useState<any>([]);
  const { address } = useAccount();

  const {
    data: myEventsArray,
    isLoading: isEventsLoading,
    isError: isEventsError,
  } = useScaffoldContractRead({
    contractName: "EventManager",
    functionName: "getOrganizerEvents",
    args: [address],
  });

  useEffect(() => {
    if (myEventsArray) {
      setMyEvents(myEventsArray);
    }
  }, [myEventsArray, myEvents]);

  if (isEventsLoading) {
    return <Loading />;
  }

  if (isEventsError) {
    return <div>Error</div>;
  }

  return (
    <>
      {myEvents?.length === 0 ? (
        <>
          <h1 className="text-center text-2xl text-bold">You have no Events Organized</h1>
          <Link href={"/events"}>
            <Button text="Back to all events" theme="secondary" />
          </Link>
        </>
      ) : (
        <>
          {!myEvents ? (
            <h1 className="text-center text-2xl text-bold">No Events</h1>
          ) : (
            <h1 className="text-center text-2xl text-bold">Events organized by you!</h1> &&
            myEvents.map((event: any, index: number) => (
              <Link key={index} href={`/events/${event.eventId}`}>
                <EventCard key={index} event={event} />
              </Link>
            ))
          )}
        </>
      )}
    </>
  );
};

export default Page;
