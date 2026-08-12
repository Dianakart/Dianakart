import Link from "next/link";

const categories = [
  { name: "Women", icon: "👗" },
  { name: "Beauty", icon: "💄" },
  { name: "Footwear", icon: "👠" },
  { name: "Handbags", icon: "👜" },
  { name: "Jewellery", icon: "💍" },
  { name: "Watches", icon: "⌚" },
  { name: "Ethnic", icon: "🥻" },
  { name: "Western", icon: "👚" },
];

export default function Categories() {
  return (
    <section className="bg-gray-50 py-14">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-bold text-gray-900">
            Shop by Category
          </h2>

          <p className="mt-3 text-gray-500">
            Explore our fashion collections
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
          {categories.map((item) => (
            <Link
              key={item.name}
              href="/products"
              className="group"
            >
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-pink-500">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-50 text-4xl transition group-hover:scale-110">
                    {item.icon}
                  </div>
                </div>

                <h3 className="mt-5 text-center text-sm font-semibold text-gray-800 group-hover:text-pink-600">
                  {item.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}