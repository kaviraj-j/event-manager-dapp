"use client";

import React, { useEffect, useState } from "react";
import Error from "next/error";
import Link from "next/link";
import { Button, Card, Input, Loading, Modal, Typography } from "@web3uikit/core";
import { useAccount } from "wagmi";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import scaffoldConfig from "~~/scaffold.config";
import { notification } from "~~/utils/scaffold-eth";

const MyTicketsPage = () => {
  const { address } = useAccount();
  const [tickets, setTickets] = useState<any>([]);
  const [showModal, setShowModal] = useState<boolean>();
  const [cancelTicketType, setCancelTicketType] = useState<string>("");
  const [cancelTicketEventId, setCancelTicketEventId] = useState<number>();
  const [ticketQuantity, setTicketQuantity] = useState<number>();
  const [cancelTicketQuantity, setCancelTicketQuantity] = useState<number>();
  // const [showCancelButton, setShowCancelButton] = useState<boolean>();

  const _args: readonly [string] = [address || ""];

  const {
    data: ticketsArray,
    isLoading: isTicketsLoading,
    isError: isTicketsError,
  } = useScaffoldContractRead({
    contractName: "EventManager",
    functionName: "getUserTickets",
    args: [_args[0] || undefined],
  });

  const { writeAsync: cancelTicket } = useScaffoldContractWrite({
    contractName: "EventManager",
    functionName: "cancelTicket",
    args: [undefined, undefined, undefined],
    blockConfirmations: scaffoldConfig.blockConfirmations,
  });

  const handleCancelTicket = (ticketEventID: number, ticketTypeName: string, ticketQuantity: number) => {
    // if(ticketEventID === undefined || ticketTypeName === undefined || ticketQuantity === undefined) {
    //   notification.error("Error");
    //   return;
    // }

    console.log(ticketEventID);
    console.log(ticketTypeName);
    console.log(ticketQuantity);
    setCancelTicketEventId(ticketEventID);
    setCancelTicketType(ticketTypeName);
    setTicketQuantity(ticketQuantity);
    openModal();
  };

  const openModal = () => {
    console.log("insdie openmodal");
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
  };

  const handleTicketQuantityChange = (event: any) => {
    const ticketQuantityToCancel = parseInt(event.target.value);
    if (ticketQuantityToCancel > Number(ticketQuantity)) {
      notification.error("You own only " + ticketQuantity + " tickets");
      setCancelTicketQuantity(0);
      event.target.value = 0;
      return;
    } else {
      setCancelTicketQuantity(ticketQuantityToCancel);
    }
  };

  const handleCancel = async () => {
    if (cancelTicketQuantity === undefined || cancelTicketEventId === undefined || cancelTicketType === "") {
      notification.error("Something went wrong");
      return;
    }
    const _args: readonly [bigint, string, bigint] = [
      BigInt(cancelTicketEventId),
      cancelTicketType,
      BigInt(cancelTicketQuantity),
    ];
    await cancelTicket({ args: _args });
  };

  useEffect(() => {
    setTickets(ticketsArray);
  }, [ticketsArray]);

  if (address === "") {
    return <Error statusCode={404} />;
  }
  if (isTicketsLoading) {
    return <Loading />;
  }

  if (isTicketsError) {
    return <Error statusCode={500} />;
  }

  return (
    <>
      <h1 className="text-center text-3xl text-bold mt-4">Tickets owned by you!!!</h1>
      {tickets?.map((ticket: any, index: number) => {
        return (
          <div className="p-2 m-4 flex flex-row" key={index}>
            <div className="p-2">
              <Link href={`/events/${ticket.eventId}`} key={index}>
                <Card
                  cursorType="default"
                  style={{
                    // display: "flex",
                    // flexDirection: "row",
                    border: "solid",
                    height: "100%",
                    width: "300px",
                  }}
                >
                  <p>Event id: {ticket.eventId.toString()}</p>
                  <p>Ticket type: {ticket.ticketType.toString()} </p>
                  <p>Your tickets: {ticket.quantity.toString()}</p>
                </Card>
              </Link>
              <Button
                theme="colored"
                color="red"
                text="cancel this ticket"
                onClick={() => handleCancelTicket(ticket.eventId, ticket.ticketType, ticket.quantity)}
              />
            </div>
          </div>
        );
      })}
      {showModal && (
        <>
          <Modal
            hasFooter={false}
            id="regular"
            onCloseButtonPressed={closeModal}
            title={
              <div style={{ display: "flex", gap: 10 }}>
                <Typography color="#68738D" variant="h3">
                  Cancel these tickets
                </Typography>
              </div>
            }
          >
            <p>Event Id: {cancelTicketEventId?.toString()} </p>
            <p>Ticket Type: {cancelTicketType} </p>
            <p>You own {ticketQuantity?.toString()} Tickets</p>

            <Input type="number" onChange={handleTicketQuantityChange} label="Number of Tickets to cancel" />
            <br />

            <Button text="Cancel" theme="colored" color="red" type="submit" onClick={handleCancel} />
          </Modal>
        </>
      )}
    </>
  );
};

export default MyTicketsPage;
