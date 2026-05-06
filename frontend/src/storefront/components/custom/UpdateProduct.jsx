import { AllCategory } from '@/storefront/redux/slices/categories/categoriesSlice';
import { getSingleProduct, updateSingleProduct } from '@/storefront/redux/slices/products/productSlice';
import React, { useEffect, useState } from 'react';
import { useDebounce } from '@/storefront/hooks/use-debounce';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useToast } from '@/storefront/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select';
import { Loader2 } from 'lucide-react';

const UpdateProduct = () => {
  const [inputValue, setInputValue] = useState({
    title: '',
    price: '',
    category: '',
    picture: '',
    description: '',
    stock: '',
    isFeatured: false,
  });

  const [previewImage, setPreviewImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');

  const { categories } = useSelector((state) => state.categories);
  const { singleProducts } = useSelector((s) => s.products);
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const toast = useToast();
  
  // Get page number from URL params to return to the same page after update
  const searchParams = new URLSearchParams(location.search);
  const returnPage = searchParams.get('page') || '1';
  
  // Debounce category search to avoid too many API calls
  const debouncedCategorySearch = useDebounce(categorySearch, 300);

  const handleChange = (e) => {
    const { name, value, type, files, checked } = e.target;
    if (type === 'file') {
      const file = files[0];
      setInputValue((values) => ({ ...values, [name]: file }));
      setPreviewImage(URL.createObjectURL(file));
    } else if (type === 'checkbox') {
      setInputValue((values) => ({ ...values, [name]: checked }));
    } else {
      setInputValue((values) => ({ ...values, [name]: value }));
    }
  };

  const handleCategoryChange = (value) => {
    setInputValue((values) => ({ ...values, category: value }));
    setCategorySearch(''); // Clear search when category is selected
  };

  const handleCategorySearch = (e) => {
    setCategorySearch(e.target.value);
  };

  // Categories are now filtered by backend - no client-side filtering needed
  const filteredCategories = categories || [];

  const handleRemoveImage = () => {
    setInputValue((prev) => ({ ...prev, picture: '' }));
    setPreviewImage('');
  };

  const handleCancel = () => {
    navigate(`/admin/dashboard/all-products?page=${returnPage}`);
  };

  // Fetch single product
  useEffect(() => {
    dispatch(getSingleProduct(id));
  }, [id, dispatch]);

  // Fetch categories - initial load
  useEffect(() => {
    dispatch(AllCategory(''));
  }, [dispatch]);

  // Fetch categories from backend when search term changes (debounced)
  useEffect(() => {
    dispatch(AllCategory(debouncedCategorySearch));
  }, [dispatch, debouncedCategorySearch]);

  useEffect(() => {
    if (singleProducts) {
      const { title, price, category, picture, description, stock, isFeatured } = singleProducts;
      setInputValue({
        title,
        price,
        category: category?._id || '',
        picture: '',
        description,
        stock,
        isFeatured: isFeatured || false,
      });
      setPreviewImage(picture?.secure_url || '');
    }
  }, [singleProducts]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    dispatch(updateSingleProduct({ inputValues: inputValue, id }))
      .unwrap()
      .then((response) => {
        if (response?.success) {
          setInputValue({
            title: '',
            price: '',
            category: '',
            picture: '',
            description: '',
            stock: '',
            isFeatured: false,
          });
          setPreviewImage('');
          toast.success('Product updated successfully!');
          navigate(`/admin/dashboard/all-products?page=${returnPage}`);
        }
      })
      .catch((error) => {
        toast.error(error || 'Failed to update product. Please try again.');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Product</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="title">Title</Label>
              <Input
                type="text"
                id="title"
                name="title"
                value={inputValue.title}
                onChange={handleChange}
                placeholder="Enter Product Title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-3">
                <Label htmlFor="price">Price</Label>
                <Input
                  type="text"
                  id="price"
                  name="price"
                  value={inputValue.price}
                  onChange={handleChange}
                  placeholder="Enter Product Price"
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="category">Category</Label>
                <Select value={inputValue.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-60">
                    {/* Search Input */}
                    <div className="p-2 border-b">
                      <Input
                        placeholder="Type first letter to filter..."
                        value={categorySearch}
                        onChange={handleCategorySearch}
                        className="h-8"
                      />
                    </div>
                    
                    {/* Category List */}
                    <div className="max-h-48 overflow-y-auto">
                      {filteredCategories.length > 0 ? (
                        filteredCategories.map((category) => (
                          <SelectItem key={category._id} value={category._id}>
                            {category.name
                              .split(' ')
                              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                              .join(' ')
                            }
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-gray-500 text-center">
                          No categories found
                        </div>
                      )}
                    </div>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-3">
                 <Label htmlFor="picture" className="text-sm font-medium text-gray-700">
    Picture
  </Label>

  <label
    htmlFor="picture"
    className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:border-blue-500 hover:bg-blue-50 transition duration-200 ease-in-out"
  >
    <span className="text-gray-500 text-sm">Click to upload</span>
    <span className="text-xs text-gray-400">(JPEG, PNG, WebP)</span>
    <Input
      type="file"
      id="picture"
      name="picture"
      accept="image/*"
      onChange={handleChange}
      className="hidden"
    />
  </label>
                {previewImage && (
                  <div className="relative mt-2 w-32 h-32">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-full h-full object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md hover:bg-red-700"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-3">
                <Label htmlFor="description">Description</Label>
                <Input
                  type="text"
                  id="description"
                  name="description"
                  value={inputValue.description}
                  onChange={handleChange}
                  placeholder="Enter Product Description"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  type="number"
                  id="stock"
                  name="stock"
                  value={inputValue.stock}
                  onChange={handleChange}
                  placeholder="Enter Product Stock"
                />
              </div>
            </div>

            {/* Featured Checkbox */}
            <div className="flex items-center space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <input
                type="checkbox"
                id="isFeatured"
                name="isFeatured"
                checked={inputValue.isFeatured || false}
                onChange={handleChange}
                className="h-5 w-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500 focus:ring-2 cursor-pointer"
              />
              <Label htmlFor="isFeatured" className="text-sm font-medium text-gray-700 flex items-center gap-2 cursor-pointer">
                <svg className="h-4 w-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>Mark as Featured Product</span>
                <span className="text-xs text-gray-500 ml-2">(Featured products appear at the top)</span>
              </Label>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                    Updating...
                  </>
                ) : (
                  'Update Product'
                )}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default UpdateProduct;
