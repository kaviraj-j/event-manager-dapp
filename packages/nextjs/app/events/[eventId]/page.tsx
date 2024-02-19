"use client";

import React, { useEffect, useState } from "react";
import { Button, Loading } from "@web3uikit/core";
import dayjs from "dayjs";
import { mainnet, useAccount } from "wagmi";
import Web3 from "web3";
import AddTickets from "~~/components/AddTickets";
import Tickets from "~~/components/Tickets";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import scaffoldConfig from "~~/scaffold.config";

function Page({ params }: { params: { eventId: string } }) {
  const [eventData, setEventData] = useState<any>({});
  const [eventId, setEventId] = useState<string>("");
  const [blockTimestamp, setBlockTimestamp] = useState(0);
  const { address } = useAccount();
  const [isOrganizer, setIsOrganizer] = useState<boolean>(false);

  const timeStampConvertor = (time: string) => dayjs.unix(parseInt(time)).format("YYYY-MM-DD HH:mm:ss");

  const {
    data: eventDataFromContract,
    isLoading,
    isError,
  } = useScaffoldContractRead({
    contractName: "EventManager",
    functionName: "events",
    args: [BigInt(params.eventId || 0)],
  });

  const { writeAsync: cancelEvent } = useScaffoldContractWrite({
    contractName: "EventManager",
    functionName: "cancelEvent",
    args: [undefined],
    blockConfirmations: scaffoldConfig.blockConfirmations,
  });
  const { writeAsync: withdrawFunds } = useScaffoldContractWrite({
    contractName: "EventManager",
    functionName: "withdrawFunds",
    args: [undefined],
    blockConfirmations: scaffoldConfig.blockConfirmations,
  });

  const handleCancelEvent = async () => {
    await cancelEvent({ args: [BigInt(eventId)] });
  };

  const hancleClaimTicketFee = async () => {
    await withdrawFunds({ args: [BigInt(eventId)] });
  };

  useEffect(() => {
    if (eventData) {
      if (eventData[6] === address) {
        setIsOrganizer(true);
      } else {
        setIsOrganizer(false);
      }
    }
    setEventId(params.eventId);
  }, [eventData, params.eventId, address]);

  useEffect(() => {
    const web3 = new Web3(`${mainnet.rpcUrls.alchemy.http[0]}/${scaffoldConfig.alchemyApiKey}`);
    web3.eth.getBlock("latest").then(async (block: any) => {
      setBlockTimestamp(Number(block.timestamp));
    });
  }, []);

  useEffect(() => {
    if (eventDataFromContract) {
      setEventData(eventDataFromContract);
    }
  }, [eventDataFromContract]);

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return <>Error</>;
  }

  return (
    <div>
      <div>
        <div className="p-5">
          <h5 className="text-center fond-bold text-4xl">{eventData[1]}</h5>
          <p className="text-center text-2xl">{eventData[2]}</p>
          <p>Location: {eventData[3]}</p>
          <p>Date and Time: {timeStampConvertor(eventData[4]) ?? eventData[4]}</p>
          <p>Organized by {isOrganizer ? <>YOU</> : <Address address={eventData[6]} />}</p>
          {Number(blockTimestamp) > Number(eventData[4]) && (
            <h5 className="mb-3 font-normal text-gray-700 dark:text-gray-400">The Event has ended :( </h5>
          )}
        </div>
      </div>
      {eventData[5] && (
        <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">The Event Is Cancelled</h5>
      )}

      <div className="m-5 p-2">
        {!eventData[5] && Number(blockTimestamp) < Number(eventData[4]) && address === eventData[6] && (
          <Button theme="secondary" text="Cancel this event" onClick={handleCancelEvent} />
        )}
      </div>
      <div className="m-5 p-2">
        {!eventData[5] && Number(blockTimestamp) >= Number(eventData[4]) && address === eventData[6] && (
          <Button theme="secondary" text="Claim the ticket fee" onClick={hancleClaimTicketFee} />
        )}
      </div>
      <div>
        {!eventData[5] && Number(blockTimestamp) < Number(eventData[4]) && address === eventData[6] && (
          <AddTickets eventId={eventId} />
        )}
      </div>

      <div>
        {!eventData[5] && Number(blockTimestamp) < Number(eventData[4]) && (
          <Tickets isOrganizer={isOrganizer} eventId={eventId} />
        )}
      </div>
    </div>
  );
}

export default Page;
