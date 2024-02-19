import { EventsListing } from "../components/EventsListing";
import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <EventsListing />
        </div>
      </div>
    </>
  );
};

export default Home;
