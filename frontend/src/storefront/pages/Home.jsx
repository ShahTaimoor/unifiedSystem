import ProductList from '@/storefront/components/custom/ProductList'
import { Button } from '@/storefront/components/ui/button'
import axios from 'axios'
import React from 'react'
import { useNavigate } from 'react-router-dom'
const Home = () => {
 

  return (
    <div>
      <ProductList />
    </div>
  )
}

export default Home
