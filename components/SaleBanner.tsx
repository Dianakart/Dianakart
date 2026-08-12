export default function SaleBanner() {
  return (
    <section className="bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 py-16">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between">

        <div className="text-white">
          <span className="bg-white text-red-600 px-4 py-2 rounded-full font-bold">
            🔥 Limited Time Offer
          </span>

          <h2 className="text-5xl font-bold mt-6">
            Mega Fashion Sale
          </h2>

          <p className="text-xl mt-4">
            Up to <span className="font-bold">70% OFF</span> on Fashion,
            Beauty & Accessories.
          </p>

          <button className="mt-8 bg-white text-red-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition">
            Shop Now →
          </button>
        </div>

        <div className="mt-10 md:mt-0">
          <img
            src="/banner-girl.png"
            alt="Sale Banner"
            className="w-[450px] rounded-2xl shadow-2xl"
          />
        </div>

      </div>
    </section>
  );
}