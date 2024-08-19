import React from 'react'
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
  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>제품 재고 관리</strong>
          </CCardHeader>
          <CCardBody>
            <CTable hover>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell scope="col">제품 분류</CTableHeaderCell>
                  <CTableHeaderCell scope="col">제품명</CTableHeaderCell>
                  <CTableHeaderCell scope="col">입고 구분</CTableHeaderCell>
                  <CTableHeaderCell scope="col">재고 수량</CTableHeaderCell>
                  <CTableHeaderCell scope="col">원가</CTableHeaderCell>
                  <CTableHeaderCell scope="col">원가 합계</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                <CTableRow>
                  <CTableDataCell>거꾸리 [일반]</CTableDataCell>
                  <CTableDataCell>비스펙 601 거꾸리</CTableDataCell>
                  <CTableDataCell>수입</CTableDataCell>
                  <CTableDataCell>179</CTableDataCell>
                  <CTableDataCell>109,100원</CTableDataCell>
                  <CTableDataCell>19,528,900원</CTableDataCell>
                </CTableRow>
                <CTableRow>
                  <CTableDataCell>거꾸리 [일반]</CTableDataCell>
                  <CTableDataCell>비스펙 601 거꾸리</CTableDataCell>
                  <CTableDataCell>수입</CTableDataCell>
                  <CTableDataCell>179</CTableDataCell>
                  <CTableDataCell>109,100원</CTableDataCell>
                  <CTableDataCell>19,528,900원</CTableDataCell>
                </CTableRow>
                <CTableRow>
                  <CTableDataCell>거꾸리 [일반]</CTableDataCell>
                  <CTableDataCell>비스펙 601 거꾸리</CTableDataCell>
                  <CTableDataCell>수입</CTableDataCell>
                  <CTableDataCell>179</CTableDataCell>
                  <CTableDataCell>109,100원</CTableDataCell>
                  <CTableDataCell>19,528,900원</CTableDataCell>
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
