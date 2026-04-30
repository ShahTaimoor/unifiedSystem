import ProductList from '@/components/custom/ProductList';
import HeroBanner from '@/components/custom/HeroBanner';
import React from 'react';

const Home = () => {
  return (
    <div>
      <HeroBanner />
      <div id="products-section">
        <ProductList />
      </div>
    </div>
  );
};

export default Home;