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
  CButton,
  CFormInput
} from '@coreui/react'

const PrimeCost = () => {
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
                  <CTableHeaderCell scope="col">기존 원가</CTableHeaderCell>
                  <CTableHeaderCell scope="col">총액</CTableHeaderCell>
                  <CTableHeaderCell scope="col">최근 변경일</CTableHeaderCell>
                  <CTableHeaderCell scope="col">변경 원가</CTableHeaderCell>
                  <CTableHeaderCell scope="col">확인</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                <CTableRow>
                  <CTableDataCell>비스펙 601 거꾸리</CTableDataCell>
                  <CTableDataCell>비스펙601거꾸리①</CTableDataCell>
                  <CTableDataCell>10113</CTableDataCell>
                  <CTableDataCell>중잉</CTableDataCell>
                  <CTableDataCell>109,100원</CTableDataCell>
                  <CTableDataCell>18,437,900</CTableDataCell>
                  <CTableDataCell>2023-08-22</CTableDataCell>
                  <CTableDataCell><CFormInput id="newPrimeCost" placeholder="0" /></CTableDataCell>
                  <CTableDataCell>
                    <CButton color="primary" type="submit">
                        확인
                    </CButton>
                  </CTableDataCell>
                </CTableRow>
                <CTableRow>
                  <CTableDataCell>비스펙 601 거꾸리</CTableDataCell>
                  <CTableDataCell>비스펙601거꾸리①</CTableDataCell>
                  <CTableDataCell>10113</CTableDataCell>
                  <CTableDataCell>중잉</CTableDataCell>
                  <CTableDataCell>109,100원</CTableDataCell>
                  <CTableDataCell>18,437,900</CTableDataCell>
                  <CTableDataCell>2023-08-22</CTableDataCell>
                  <CTableDataCell><CFormInput id="newPrimeCost" placeholder="0" /></CTableDataCell>
                  <CTableDataCell>
                    <CButton color="primary" type="submit">
                        확인
                    </CButton>
                  </CTableDataCell>
                </CTableRow>
                <CTableRow>
                  <CTableDataCell>비스펙 601 거꾸리</CTableDataCell>
                  <CTableDataCell>비스펙601거꾸리①</CTableDataCell>
                  <CTableDataCell>10113</CTableDataCell>
                  <CTableDataCell>중잉</CTableDataCell>
                  <CTableDataCell>109,100원</CTableDataCell>
                  <CTableDataCell>18,437,900</CTableDataCell>
                  <CTableDataCell>2023-08-22</CTableDataCell>
                  <CTableDataCell><CFormInput id="newPrimeCost" placeholder="0" /></CTableDataCell>
                  <CTableDataCell>
                    <CButton color="primary" type="submit">
                        확인
                    </CButton>
                  </CTableDataCell>
                </CTableRow>
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default PrimeCost
