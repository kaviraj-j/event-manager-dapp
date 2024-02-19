import React from "react";
import dayjs from "dayjs";

const EventCard = ({ event }: any) => {
  const eventTime = dayjs.unix(parseInt(event.time)).format("YYYY-MM-DD HH:mm:ss");

  return (
    <div className="max-w-sm bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 m-4">
      <a href={`/events/` + event.eventId}></a>
      <div className="p-5">
        <a href={`/events/` + event.eventId}>
          <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">#{event.eventId.toString()}</p>
          <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{event.name}</h5>
        </a>
        <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">{event.description}</p>
        <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">Date and time: {eventTime}</p>
      </div>
    </div>
  );
};

export default EventCard;
