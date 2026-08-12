const products = [
  {
    id: 1,
    name: "Elegant Kurti",
    price: "₹899",
    oldPrice: "₹1499",
    image: "/products/dress1.jpg",
  },
  {
    id: 2,
    name: "Pink Handbag",
    price: "₹1499",
    oldPrice: "₹2499",
    image: "/products/bag1.jpg",
  },
  {
    id: 3,
    name: "Party Heels",
    price: "₹1199",
    oldPrice: "₹1999",
    image: "/products/heels1.jpg",
  },
  {
    id: 4,
    name: "Luxury Watch",
    price: "₹1999",
    oldPrice: "₹3499",
    image: "/products/watch1.jpg",
  },
  {
    id: 5,
    name: "Summer Dress",
    price: "₹999",
    oldPrice: "₹1799",
    image: "/products/dress1.jpg",
  },
  {
    id: 6,
    name: "Designer Bag",
    price: "₹1599",
    oldPrice: "₹2599",
    image: "/products/bag1.jpg",
  },
  {
    id: 7,
    name: "Fashion Sandals",
    price: "₹999",
    oldPrice: "₹1699",
    image: "/products/heels1.jpg",
  },
  {
    id: 8,
    name: "Classic Watch",
    price: "₹1899",
    oldPrice: "₹2999",
    image: "/products/watch1.jpg",
  },
];

export default function NewArrivals() {
  return (
    <section className="bg-gray-100 py-16">
      <div className="max-w-7xl mx-auto px-6">

        <h2 className="text-4xl font-bold text-center mb-10">
          New Arrivals
        </h2>

        <div className="grid md:grid-cols-4 gap-8">

          {products.map((item) => (

            <div
              key={item.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition duration-300"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-72 object-cover"
              />

              <div className="p-5">

                <h3 className="font-bold text-lg">
                  {item.name}
                </h3>

                <div className="flex gap-2 mt-2">

                  <span className="text-blue-700 font-bold">
                    {item.price}
                  </span>

                  <span className="line-through text-gray-500">
                    {item.oldPrice}
                  </span>

                </div>

                <button className="mt-5 w-full bg-pink-600 hover:bg-pink-700 text-white py-3 rounded-xl">
                  Add to Cart
                </button>

              </div>

            </div>

          ))}

        </div>

      </div>
    </section>
  );
}