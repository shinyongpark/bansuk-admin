import React, { useState, useEffect } from 'react';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableCaption,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'

const ProductList = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8080/products/product-list');
        const data = await response.json();
        setCategories(data.products);
        console.log(data);
        console.log('data sent')
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>거꾸리 [일반]</strong>
          </CCardHeader>
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
                <CTableRow>
                  <CTableDataCell>비스펙 601 거꾸리</CTableDataCell>
                  <CTableDataCell>비스펙601거꾸리①</CTableDataCell>
                  <CTableDataCell>10113</CTableDataCell>
                  <CTableDataCell>중잉</CTableDataCell>
                  <CTableDataCell>-</CTableDataCell>
                  <CTableDataCell>169</CTableDataCell>
                  <CTableDataCell>수입</CTableDataCell>
                  <CTableDataCell>2023-08-22</CTableDataCell>
                  <CTableDataCell>1</CTableDataCell>
                  <CTableDataCell>-</CTableDataCell>
                  <CTableDataCell>-</CTableDataCell>
                </CTableRow>
                <CTableRow>
                  <CTableDataCell>비스펙 601 거꾸리</CTableDataCell>
                  <CTableDataCell>비스펙601거꾸리①</CTableDataCell>
                  <CTableDataCell>10113</CTableDataCell>
                  <CTableDataCell>중잉</CTableDataCell>
                  <CTableDataCell>-</CTableDataCell>
                  <CTableDataCell>169</CTableDataCell>
                  <CTableDataCell>수입</CTableDataCell>
                  <CTableDataCell>2023-08-22</CTableDataCell>
                  <CTableDataCell>1</CTableDataCell>
                  <CTableDataCell>-</CTableDataCell>
                  <CTableDataCell>-</CTableDataCell>
                </CTableRow>
                <CTableRow>
                  <CTableDataCell>비스펙 601 거꾸리</CTableDataCell>
                  <CTableDataCell>비스펙601거꾸리①</CTableDataCell>
                  <CTableDataCell>10113</CTableDataCell>
                  <CTableDataCell>중잉</CTableDataCell>
                  <CTableDataCell>-</CTableDataCell>
                  <CTableDataCell>169</CTableDataCell>
                  <CTableDataCell>수입</CTableDataCell>
                  <CTableDataCell>2023-08-22</CTableDataCell>
                  <CTableDataCell>1</CTableDataCell>
                  <CTableDataCell>-</CTableDataCell>
                  <CTableDataCell>-</CTableDataCell>
                </CTableRow>
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default ProductList
