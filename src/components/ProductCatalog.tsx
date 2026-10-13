import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { Flower, SlidersHorizontal, AlertTriangle } from 'lucide-react';

interface ProductCatalogProps {
  products: Product[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
}) => {
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc' | 'rating'>('popular');
  const [activeProductModal, setActiveProductModal] = useState<Product | null>(null);

  // Filter and sort
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return b.soldCount - a.soldCount; // popular
    });
  }, [products, selectedCategory, searchQuery, sortBy]);

  // Count items with low stock (< 5)
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 4).length;

  return (
    <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Catalog Header Controls with Soft Styling */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#f2dee3]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#9e4659]">
            <Flower className="w-3.5 h-3.5 text-[#b5586b]" />
            <span>Koleksi Bunga Eksklusif Floristique</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#273830] mt-1">
            {selectedCategory === 'Semua' ? 'Seluruh Koleksi Pilihan' : selectedCategory}
          </h2>
          <p className="text-xs sm:text-sm text-[#66756d] mt-1">
            Menampilkan <strong className="text-[#395c47]">{filteredProducts.length} produk bunga</strong> segar siap rangkai & kirim langsung dari atelier
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[#738078]">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#b5586b]" />
            <span className="hidden sm:inline">Urutkan:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs sm:text-sm bg-white border border-[#e8d5da] rounded-xl px-3 py-2 text-[#3d4b43] focus:outline-hidden focus:border-[#b5586b] focus:ring-1 focus:ring-[#fcebef] shadow-2xs cursor-pointer"
          >
            <option value="popular">Paling Populer & Terlaris</option>
            <option value="rating">Rating Tertinggi ★</option>
            <option value="price-asc">Harga: Terendah ke Tertinggi</option>
            <option value="price-desc">Harga: Tertinggi ke Terendah</option>
          </select>
        </div>
      </div>

      {/* Low Stock Notice if any */}
      {lowStockCount > 0 && (
        <div className="mt-4 p-3 rounded-xl bg-[#fdf2f4] border border-[#f5d7de] text-[#9c4355] text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#b5586b] shrink-0" />
          <span>
            Beberapa bunga favorit memiliki stok terbatas hari ini. Segera pesan untuk mengamankan slot perangkaian Anda!
          </span>
        </div>
      )}

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onViewDetails={(p) => setActiveProductModal(p)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-16 text-center py-12 px-4 bg-[#fbf5f7] rounded-3xl border border-[#f0dee2]">
          <p className="text-[#6d7971] text-base font-medium">
            Tidak ada produk yang sesuai dengan pencarian "{searchQuery}" pada kategori {selectedCategory}.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('Semua');
            }}
            className="mt-4 px-5 py-2.5 bg-[#3f6351] text-white rounded-xl text-xs font-semibold hover:bg-[#345343] transition-colors shadow-2xs"
          >
            Lihat Semua Koleksi (12 Produk)
          </button>
        </div>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={activeProductModal}
        onClose={() => setActiveProductModal(null)}
      />
    </section>
  );
};
