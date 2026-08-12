const categories = [
  {
    title: "Women's Fashion",
    image: "/products/dress.jpg",
  },
  {
    title: "Handbags",
    image: "/products/bag.jpg",
  },
  {
    title: "Footwear",
    image: "/products/heels.jpg",
  },
  {
    title: "Watches",
    image: "/products/watch.jpg",
  },
];

export default function TrendingCollection() {
  return (
    <section className="bg-black py-16">
      <div className="max-w-7xl mx-auto px-6">

        <h2 className="text-4xl font-bold text-white mb-10">
          🔥 Trending Collection
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {categories.map((item, index) => (

            <div
              key={index}
              className="bg-white rounded-2xl overflow-hidden shadow-xl hover:scale-105 duration-300 cursor-pointer"
            >

              <img
                src={item.image}
                className="h-72 w-full object-cover"
                alt={item.title}
              />

              <div className="p-5">

                <h3 className="text-xl font-bold">
                  {item.title}
                </h3>

                <button className="mt-4 bg-pink-600 text-white px-5 py-2 rounded-lg">
                  Explore
                </button>

              </div>

            </div>

          ))}

        </div>

      </div>
    </section>
  );
}