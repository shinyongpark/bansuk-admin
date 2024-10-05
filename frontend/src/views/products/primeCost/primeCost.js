import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CCollapse,
  CFormInput
} from '@coreui/react';

const ProductsByCategory = () => {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [updateProducts, setUpdateProducts] = useState([]);
  const [totalPrimeCost, setTotalPrimeCost] = useState(0);

  useEffect(() => {
    fetchCategories();
    fetchTotalPrimeCost();
  }, []);

  const fetchTotalPrimeCost = async () => {
    try {
      const response = await axios.get('https://bs-admin.com:443/get-total-prime-cost');
      setTotalPrimeCost(response.data.totalPrimeCost);
    } catch (error) {
      console.error('Error fetching total prime cost:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('https://bs-admin.com:443/get-categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async (categoryId) => {
    try {
      const response = await axios.get(`https://bs-admin.com:443/get-products?category=${categoryId}`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products for category:', categoryId, error);
    }
  };

  const toggleCategory = (categoryId) => {
    if (activeCategory === categoryId) {
      setActiveCategory(null);
      setProducts([]);
    } else {
      setActiveCategory(categoryId);
      fetchProducts(categoryId);
    }
  };

  const handleChange = (id, newCost) => {
    setUpdateProducts(prev => ({
      ...prev,
      [id]: newCost
    }));
  };

  const handleCostUpdate = async (id, e) => {
    e.preventDefault()

    if (!updateProducts[id] || isNaN(Number(updateProducts[id]))) {
      alert('Please enter a valid cost.');
      return;
    }
    try {
      // Assume newCost is converted to a number if it's a valid number string
      const newCost = parseFloat(updateProducts[id]).toFixed(0); // Keeping two decimals for currency values

      // Sending the updated cost to the server
      const response = await axios.post('https://bs-admin.com:443/update-product-cost', {
        id,
        newPrimeCost: newCost
      }, {
        withCredentials: true
      });

      // Handling the response from the server
      if (response.data && response.status === 200) {
        alert('제품 원가가 성공적으로 업데이트 되었습니다!');
        setProducts(products.map(product =>
          product.id === id ? { ...product, primeCost: newCost } : product
        ));
      } else {
        throw new Error('Failed to update the product cost.');
      }
    } catch (error) {
      console.error('제품 업데이트 실패:', error);
      alert('제품 원가 업데이트 실패');
    }
  };


  return (
    <CRow>
      <CCol xs={12}>
        <CAlert color="info">
          <h4>원가 총합: ₩{totalPrimeCost}</h4>
        </CAlert>
        {categories.map((category) => (
          <CCard key={category.id} className="mb-3">
            <CCardHeader>
              <strong>{category.name}</strong>
              <CButton size="sm" color="link" onClick={() => toggleCategory(category.id)}>
                {activeCategory === category.id ? 'Hide Details' : 'Show Details'}
              </CButton>
            </CCardHeader>
            <CCollapse visible={activeCategory === category.id}>
              <CCardBody>
                <CTable hover>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell scope="col">제품명</CTableHeaderCell>
                      <CTableHeaderCell scope="col">자동분류명</CTableHeaderCell>
                      <CTableHeaderCell scope="col">상품 코드</CTableHeaderCell>
                      <CTableHeaderCell scope="col">공장</CTableHeaderCell>
                      <CTableHeaderCell scope="col">기존 원가</CTableHeaderCell>
                      <CTableHeaderCell scope="col">총액</CTableHeaderCell>
                      {/* <CTableHeaderCell scope="col">최근 변경일</CTableHeaderCell> */}
                      <CTableHeaderCell scope="col">변경 원가</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {products.map((product) => (
                      <CTableRow key={product.id}>
                        <CTableDataCell>{product.productName}</CTableDataCell>
                        <CTableDataCell>{product.nickname}</CTableDataCell>
                        <CTableDataCell>{product.id}</CTableDataCell>
                        <CTableDataCell>{product.factory}</CTableDataCell>
                        <CTableDataCell>{product.primeCost}</CTableDataCell>
                        <CTableDataCell>{product.primeCost * product.stock}</CTableDataCell>
                        {/* <CTableDataCell>{'Latest Change Date'}</CTableDataCell> */}
                        <CTableDataCell>
                          <CFormInput
                            type="text"
                            onChange={(e) => handleChange(product.id, e.target.value)}
                          />
                        </CTableDataCell>
                        <CTableDataCell>
                          <CButton
                            color="primary"
                            onClick={(e) => handleCostUpdate(product.id, e)}
                          >
                            확인
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </CCardBody>
            </CCollapse>
          </CCard>
        ))}
      </CCol>
    </CRow>
  );
};

export default ProductsByCategory;