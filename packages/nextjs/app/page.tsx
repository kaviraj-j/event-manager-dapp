import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center mb-8">
            <span className="block text-4xl mb-2 font-bold">Upcoming Events</span>
          </h1>
        </div>
      </div>
    </>
  );
};

export default Home;
