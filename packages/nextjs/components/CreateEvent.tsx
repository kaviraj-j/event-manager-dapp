"use client";

import { FormEvent, useState } from "react";
import { Button, DatePicker, Input, Modal, Typography } from "@web3uikit/core";
import dayjs from "dayjs";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import scaffoldConfig from "~~/scaffold.config";
import { notification } from "~~/utils/scaffold-eth";

const CreateEvent = () => {
  const [showModal, setShowModal] = useState<boolean>(false);

  const openModal = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const { writeAsync: createEvent } = useScaffoldContractWrite({
    contractName: "EventManager",
    functionName: "createEvent",
    args: [undefined, undefined, undefined, undefined],
    blockConfirmations: scaffoldConfig.blockConfirmations,
  });

  const handleCreateEventClick = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const eventName = formData.get("event-name")?.toString() ?? "";
    const eventDescription = formData.get("event-description")?.toString() ?? "";
    const eventLocation = formData.get("event-location")?.toString() ?? "";
    const datePicker = formData.get("date-picker");
    if (!datePicker) {
      notification.error("Please select a date");
      return;
    }
    const eventDate = dayjs(datePicker.toString()).valueOf() / 1000;

    if (eventName === "" || eventDescription === "" || eventLocation === "" || eventDate === null) {
      notification.error("Please fill in all fields");
      return;
    }

    const _args: readonly [string, string, string, bigint] = [
      eventName,
      eventDescription,
      eventLocation,
      BigInt(eventDate),
    ];
    await createEvent({ args: _args });
    closeModal();
  };

  return (
    <>
      <Button
        text="Create Event"
        theme="secondary"
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        }
        onClick={() => openModal()}
      />
      {showModal && (
        <Modal
          hasFooter={false}
          id="regular"
          onCloseButtonPressed={closeModal}
          title={
            <div style={{ display: "flex", gap: 10 }}>
              <Typography color="#68738D" variant="h3">
                Create New Event
              </Typography>
            </div>
          }
        >
          <form
            className="flex flex-col space-y-10"
            onSubmit={async event => {
              handleCreateEventClick(event);
            }}
          >
            <div>
              <Input label="Event Name" type="text" id="event-name" name="event-name" />
            </div>
            <div>
              <Input label="Event Description" type="text" id="event-description" name="event-description" />
            </div>
            <div>
              <Input label="Event Location" type="text" id="event-location" name="event-location" />
            </div>

            <DatePicker
              label="Event Date"
              id="date-picker"
              name="date-picker"
              validation={{
                min: new Date(new Date().getTime() + 86400000).toISOString().split("T")[0],
                required: true,
              }}
              value=""
            />
            <div className="flex flex-row w-full justify-between">
              <Button onClick={closeModal} text="Cancel" theme="secondary" />

              <Button text="Create Event" theme="primary" type="submit" />
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};

export default CreateEvent;
