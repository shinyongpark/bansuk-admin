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
      const response = await axios.get('/get-total-prime-cost');
      setTotalPrimeCost(response.data.totalPrimeCost);
    } catch (error) {
      console.error('Error fetching total prime cost:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/get-categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async (categoryId) => {
    try {
      const response = await axios.get(`/get-products?category=${categoryId}`);
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

  const handleChange = (id, newCost, costType) => {
    setUpdateProducts(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [costType]: newCost
      }
    }));
  };

  const handleCostUpdate = async (id, e) => {
    e.preventDefault();
  
    const costData = updateProducts[id];
    // Check if cost data is present and validate the cost entries to ensure they're not empty strings and are valid numbers
    if (!costData || 
        costData.primeCost === "" || 
        isNaN(Number(costData.primeCost)) ||
        isNaN(Number(costData.primeCost2))) {
      alert('두 원가 모두 기입해주세요. 달러 원가가 없으면 0으로 기입하세요.');
      return;
    }
  
    try {
      // Prepare data ensuring numbers are properly formatted; skip update if either cost input is not modified (i.e., remains empty)
      const newPrimeCost = costData.primeCost.trim() === "" ? undefined : parseFloat(costData.primeCost).toFixed(0);
      const newPrimeCost2 = costData.primeCost2.trim() === "" ? undefined : parseFloat(costData.primeCost2).toFixed(2);
  
      // Only send the request if there is something to update
      if (newPrimeCost !== undefined || newPrimeCost2 !== undefined) {
        const response = await axios.post('/update-product-cost', {
          id,
          newPrimeCost,
          newPrimeCost2
        }, {
          withCredentials: true
        });
  
        if (response.data && response.status === 200) {
          alert('Product costs updated successfully!');
          setProducts(products.map(product =>
            product.id === id ? { ...product, primeCost: newPrimeCost || product.primeCost, primeCost2: newPrimeCost2 || product.primeCost2 } : product
          ));
        } else {
          throw new Error('Failed to update the product costs.');
        }
      } else {
        alert('No changes were made as no valid costs were entered.');
      }
    } catch (error) {
      console.error('Product update failed:', error);
      alert('Failed to update product costs.');
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
                      <CTableHeaderCell scope="col">원가₩</CTableHeaderCell>
                      <CTableHeaderCell scope="col">원가$</CTableHeaderCell>
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
                        <CTableDataCell>{product.primeCost2}</CTableDataCell>
                        <CTableDataCell>{product.primeCost * product.stock}</CTableDataCell>
                        {/* <CTableDataCell>{'Latest Change Date'}</CTableDataCell> */}
                        <CTableDataCell>
                          KRW: <CFormInput type="text" value={updateProducts[product.id]?.primeCost || ''} onChange={(e) => handleChange(product.id, e.target.value, 'primeCost')} />
                          USD: <CFormInput type="text" value={updateProducts[product.id]?.primeCost2 || ''} onChange={(e) => handleChange(product.id, e.target.value, 'primeCost2')} />
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