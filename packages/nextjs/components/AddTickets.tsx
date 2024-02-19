"use client";

import React, { useState } from "react";
import { EtherInput } from "./scaffold-eth";
import { Button, Input } from "@web3uikit/core";
import Web3 from "web3";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import scaffoldConfig from "~~/scaffold.config";
import { notification } from "~~/utils/scaffold-eth";

interface TicketsProps {
  eventId: string;
}

function AddTickets({ eventId }: TicketsProps) {
  const [ticketTypeName, setTicketTypeName] = useState<string>("");
  const [ticketPrice, setTicketPrice] = useState<string>("");
  const [totalTickets, setTotalTickets] = useState<number>(0);

  const { writeAsync: addTicketType } = useScaffoldContractWrite({
    contractName: "EventManager",
    functionName: "addTicketType",
    args: [undefined, undefined, undefined, undefined],
    blockConfirmations: scaffoldConfig.blockConfirmations,
  });

  const handleTicketTypeChange = (event: any) => {
    if (event.target.value !== null) setTicketTypeName(event.target.value);
  };

  const handleTotalTicketsChange = (event: any) => {
    if (event.target.value !== null) setTotalTickets(Number(event.target.value));
  };

  const resetTicketType = () => {
    setTicketTypeName("");
    setTicketPrice("");
    setTotalTickets(0);
  };

  const handleAddTicketType = async () => {
    if (ticketTypeName === "" && totalTickets !== 0) {
      notification.error("Enter valid data");
    }
    const ticketPriceInWei = BigInt(Web3.utils.toWei(Number(ticketPrice), "ether"));

    const _args: readonly [bigint, string, bigint, bigint] = [
      BigInt(eventId),
      ticketTypeName,
      ticketPriceInWei,
      BigInt(totalTickets),
    ];

    await addTicketType({ args: _args });
    resetTicketType();
  };

  return (
    <>
      <div className="margin-10 border-2 p-5">
        <h2 className="text-xl font-bold mb-4">Add new Ticket type</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2">Ticket Name</label>
            <Input type="text" onChange={handleTicketTypeChange} />
          </div>
          <div>
            <label className="block mb-2">Price in ETH</label>
            <EtherInput
              name="reserve-price"
              value={ticketPrice}
              onChange={amount => {
                setTicketPrice(String(amount));
              }}
            />
          </div>
          <div>
            <label className="block mb-2">Total Tickets</label>
            <Input type="number" onChange={handleTotalTicketsChange} />
          </div>
        </div>
        <div className="mt-10">
          <Button text="Add ticket type" theme="secondary" onClick={handleAddTicketType} />
        </div>
      </div>
    </>
  );
}

export default AddTickets;
