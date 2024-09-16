import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
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
  CCollapse
} from '@coreui/react';

const ProductsByCategory = () => {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:8080/get-categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async (categoryId) => {
    try {
      const response = await axios.get(`http://localhost:8080/get-products?category=${categoryId}`);
      // Filter products to include only those with stock available
      const filteredProducts = response.data.filter(product => product.stock !== 'N/A');
      setProducts(filteredProducts);
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

  return (
    <CRow>
      <CCol xs={12}>
        {categories.map((category) => (
          <CCard key={category.id} className="mb-3">
            <CCardHeader>
              <strong>{category.name}</strong>
              <CButton size="sm" color="link" onClick={() => toggleCategory(category.id)}>
                {activeCategory === category.id ? 'Hide Products' : 'Show Products'}
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
                      <CTableHeaderCell scope="col">인증</CTableHeaderCell>
                      <CTableHeaderCell scope="col">재고량</CTableHeaderCell>
                      <CTableHeaderCell scope="col">입고 구분</CTableHeaderCell>
                      <CTableHeaderCell scope="col">최근 입고 날짜</CTableHeaderCell>
                      <CTableHeaderCell scope="col">최근 입고량</CTableHeaderCell>
                      <CTableHeaderCell scope="col">비고</CTableHeaderCell>
                      <CTableHeaderCell scope="col">쿠팡</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {products.map((product) => (
                      <CTableRow key={product.id}>
                        <CTableDataCell>{product.productName}</CTableDataCell>
                        <CTableDataCell>{product.nickname}</CTableDataCell>
                        <CTableDataCell>{product.id}</CTableDataCell>
                        <CTableDataCell>{product.factory}</CTableDataCell>
                        <CTableDataCell>{product.good_kc}</CTableDataCell>
                        <CTableDataCell>{product.stock}</CTableDataCell>
                        <CTableDataCell>{product.import === '0' ? '국내' : '수입'}</CTableDataCell>
                        <CTableDataCell>{product.recentIncomingDate}</CTableDataCell>
                        <CTableDataCell>{product.recentIncomingQuantity}</CTableDataCell>
                        <CTableDataCell>{product.remarks}</CTableDataCell>
                        <CTableDataCell>{product.coupang}</CTableDataCell>
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
