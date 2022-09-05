import PkgMiniLink from "../components/pkgMiniLink";

export default function Web() {
  return (
    <div className="flex flex-col w-full px-4">
      <section
        id="main"
        className="flex flex-row w-full h-full bg-[#3B3B3B] bg-opacity-20 border border-white rounded-lg mt-7"
      >
        <div className="flex flex-col w-2/5 h-full p-5">
          <h1 className="text-2xl font-bold text-left">Popular Libraries</h1>
          <PkgMiniLink
            name="React"
            description="A JavaScript library for building user interfaces"
            slug="react"
          />
          <PkgMiniLink
            name="React DOM"
            description="React package for working with the DOM."
            slug="react-dom"
          />
          <PkgMiniLink
            name="Vue"
            description="Vue.js is a progressive, incrementally-adoptable JavaScript framework for building UI on the web."
            slug="vue"
          />
        </div>
        <div className="flex flex-col w-2/5 h-max p-10">
          <h1 className="text-2xl font-bold text-left">Categories</h1>
        </div>
        <div className="flex flex-col w-1/5 h-full p-10">
          <h1 className="text-2xl font-bold text-left">NPM Stats</h1>
        </div>
      </section>
    </div>
  );
}
