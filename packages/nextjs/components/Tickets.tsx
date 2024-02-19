"use client";

import React, { useEffect, useState } from "react";
import { Button, Input, Loading, Modal, Typography } from "@web3uikit/core";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import scaffoldConfig from "~~/scaffold.config";
import { notification } from "~~/utils/scaffold-eth";

interface TicketsProps {
  isOrganizer: boolean;
  eventId: string;
}

function Tickets({ isOrganizer, eventId }: TicketsProps) {
  const [ticketsArray, setTicketsArray] = useState<any[] | undefined>();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [ticket, setTicket] = useState<any>({});
  const [amountToPay, setAmountToPay] = useState<number>(0);
  const [numberOfTickets, setNumberOfTickets] = useState<number>(0);

  const openModal = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    resetTicket();
    setShowModal(false);
  };

  const resetTicket = () => {
    setTicket({});
    setAmountToPay(0);
    setNumberOfTickets(0);
  };

  const handleBuyTicket = (ticketType: string, ticketPrice: number, availableTickets: number) => {
    const ticketObj = { ticketType: ticketType, ticketPrice: ticketPrice, availableTickets: availableTickets };
    setTicket(ticketObj);
    openModal();
  };

  const handleTicketInputChange = (event: any) => {
    const _numberOfTickets = parseInt(event.target.value);
    if (_numberOfTickets > ticket.availableTickets) {
      notification.error("Available tickets: " + ticket.availableTickets);
      setNumberOfTickets(_numberOfTickets);
      event.target.value = ticket.availableTicket;
      return;
    } else {
      const amountInWei = ticket.ticketPrice * _numberOfTickets;
      setAmountToPay(amountInWei);
      setNumberOfTickets(_numberOfTickets);
    }
  };

  const { writeAsync: buyTicket } = useScaffoldContractWrite({
    contractName: "EventManager",
    functionName: "buyTicket",
    args: [undefined, undefined, undefined],
    blockConfirmations: scaffoldConfig.blockConfirmations,
  });
  const handleBuy = async () => {
    const _args: readonly [bigint, string, bigint] = [
      BigInt(eventId),
      ticket.ticketType.toString(),
      BigInt(numberOfTickets),
    ];
    await buyTicket({ args: _args, value: BigInt(amountToPay) });
  };

  const { data: ticketsData, isLoading } = useScaffoldContractRead({
    contractName: "EventManager",
    functionName: "getEventTicketDetails",
    args: [BigInt(eventId)],
  });

  const weiToEth = (number: number): number => {
    return number / 10 ** 18;
  };

  useEffect(() => {
    if (ticketsData) {
      setTicketsArray(ticketsData as any);
    }
  }, [ticketsData]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div>
      {ticketsArray && (
        <div className="margin-10 border-2">
          <h2 className="text-xl font-bold mb-4 p-5">Tickets</h2>
          <div className="grid grid-cols-4 gap-4">
            {ticketsArray[0].map((ticketName: string, index: number) => (
              <div key={index} className="p-5">
                <h3 className="text-lg font-bold mb-2">{ticketName}</h3>
                <p className="mb-1">Price: {weiToEth(Number(ticketsArray[1][index]))} ETH</p>
                <p className="mb-1">Total Tickets: {Number(ticketsArray[2][index])}</p>
                <p className="mb-1">Available Tickets: {Number(ticketsArray[3][index])}</p>

                {!isOrganizer && (
                  <Button
                    onClick={() => {
                      handleBuyTicket(ticketName, Number(ticketsArray[1][index]), Number(ticketsArray[3][index]));
                    }}
                    text="Buy tickets"
                    theme="secondary"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <>
          <Modal
            hasFooter={false}
            id="regular"
            onCloseButtonPressed={closeModal}
            title={
              <div style={{ display: "flex", gap: 10 }}>
                <Typography color="#68738D" variant="h3">
                  Buy {ticket.ticketType} tickets
                </Typography>
              </div>
            }
          >
            <p>Available: {ticket.availableTickets}</p>
            <Input type="number" onChange={handleTicketInputChange}></Input>
            <br />
            <p>Pay: {weiToEth(Number(amountToPay))} ETH</p>
            <Button text="Buy Ticket/s" theme="primary" type="submit" isLoading={isLoading} onClick={handleBuy} />
          </Modal>
        </>
      )}
    </div>
  );
}

export default Tickets;
