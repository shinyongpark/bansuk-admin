import React from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CFormSwitch,
  CRow,
} from '@coreui/react'
import { DocsExample } from 'src/components'

const Layout = () => {
  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>입출고 입력</strong>
          </CCardHeader>
          <CCardBody>
            <p className="text-body-secondary small">
              입출고 입력시, 입고 출고 구분을 확실하게 해주시고, 모든 정보가 정확하게 기입되었는지 확인 후에 확인 버튼을 눌러주세요.
            </p>
              <CForm className="row g-3">
                <CCol md={2}>
                  <CFormLabel>입출고 구분</CFormLabel>
                  <CFormCheck
                      type="radio"
                      name="flexRadioDefault"
                      id="incoming"
                      label="입고"
                  />
                  <CFormCheck
                      type="radio"
                      name="flexRadioDefault"
                      id="outgoing"
                      label="출고"
                      defaultChecked
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel>카테고리</CFormLabel>
                  <CFormSelect aria-label="Default select example">
                    <option>Open this select menu</option>
                    <option value="1">One</option>
                    <option value="2">Two</option>
                    <option value="3">Three</option>
                  </CFormSelect>
                </CCol>
                <CCol md={6}>
                  <CFormLabel>제품명</CFormLabel>
                  <CFormSelect aria-label="Default select example">
                    <option>Open this select menu</option>
                    <option value="1">One</option>
                    <option value="2">Two</option>
                    <option value="3">Three</option>
                  </CFormSelect>
                </CCol>
                <CCol md={4}>
                  <CFormLabel>날짜</CFormLabel>
                  <CFormInput id="inputDate" placeholder="YYYY-MM-DD" />
                </CCol>
                <CCol md={2}>
                  <CFormLabel>수량</CFormLabel>
                  <CFormInput id="inputNum" placeholder="00" />
                </CCol>
                <CCol md={6}>
                  <CFormLabel>설명</CFormLabel>
                  <CFormInput id="inputComment" placeholder="설명 기재" />
                </CCol>
                <CCol xs={12}>
                  <CButton color="primary" type="submit">
                    확인
                  </CButton>
                </CCol>
              </CForm>
          </CCardBody>
        </CCard>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>제품 수정</strong>
          </CCardHeader>
          <CCardBody>
            <p className="text-body-secondary small">
              비활성시에는 제품 분류와 제품명을 선택후 비활성화로 바꾸면 됩니다.
            </p>
              <CForm className="row g-3">
              <CCol md={1}>
                  <CFormLabel>입고 구분</CFormLabel>
                  <CFormCheck
                      type="radio"
                      name="flexRadioDefault"
                      id="incoming"
                      label="수입"
                  />
                  <CFormCheck
                      type="radio"
                      name="flexRadioDefault"
                      id="outgoing"
                      label="국내"
                      defaultChecked
                  />
                </CCol>
                <CCol md={2}>
                  <CFormLabel>카테고리</CFormLabel>
                  <CFormSelect aria-label="Default select example">
                    <option>Open this select menu</option>
                    <option value="1">One</option>
                    <option value="2">Two</option>
                    <option value="3">Three</option>
                  </CFormSelect>
                </CCol>
                <CCol md={2}>
                  <CFormLabel>제품 코드</CFormLabel>
                  <CFormInput id="inputProductNum" placeholder="00000.00" />
                </CCol>
                <CCol md={4}>
                  <CFormLabel>제품명</CFormLabel>
                  <CFormSelect aria-label="Default select example">
                    <option>Open this select menu</option>
                    <option value="1">One</option>
                    <option value="2">Two</option>
                    <option value="3">Three</option>
                  </CFormSelect>
                </CCol>
                <CCol md={3}>
                  <CFormLabel>제품 처리 방법</CFormLabel>
                  <CFormCheck
                    type="radio"
                    name="flexRadioDefault"
                    id="activate"
                    label="활성화"
                  />
                  <CFormCheck
                    type="radio"
                    name="flexRadioDefault"
                    id="disactivate"
                    label="비활성화"
                  />
                  <CFormCheck
                    type="radio"
                    name="flexRadioDefault"
                    id="noChange"
                    label="변경 없음"
                    defaultChecked
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel>공장명</CFormLabel>
                  <CFormInput id="inputFactory" placeholder="" />
                </CCol>
                <CCol md={4}>
                  <CFormLabel>제품명</CFormLabel>
                  <CFormInput id="inputNewProdName" placeholder="" />
                </CCol>
                <CCol md={4}>
                  <CFormLabel>자동분류명</CFormLabel>
                  <CFormInput id="inputNewNickname" placeholder="" />
                </CCol>
                <CCol md={4}>
                  <CFormLabel>비고</CFormLabel>
                  <CFormInput id="inputNewComment" placeholder="" />
                </CCol>
                <CCol md={2}>
                  <CFormLabel>쿠팡</CFormLabel>
                  <CFormInput id="inputCoupang" placeholder="" />
                </CCol>
                <CCol md={2}>
                  <CFormLabel>인증</CFormLabel>
                  <CFormInput id="inputValidation" placeholder="" />
                </CCol>
                <CCol md={4}>
                  <CFormLabel>제품 설명</CFormLabel>
                  <CFormInput id="inputValidation" placeholder="" />
                </CCol>
                <CCol md={4}>
                  <CFormLabel>택배 배송비</CFormLabel>
                  <CFormInput id="inputDeliveryFee" placeholder="" />
                </CCol>
                <CCol md={4}>
                  <CFormLabel>화물택배 배송비</CFormLabel>
                  <CFormInput id="inputContainerDeliveryFee" placeholder="" />
                </CCol>
                <CCol md={4}>
                  <CFormLabel>화물 배송비</CFormLabel>
                  <CFormInput id="inputContainerFee" placeholder="" />
                </CCol>
                <CCol xs={12}>
                  <CButton color="primary" type="submit">
                    확인
                  </CButton>
                </CCol>
              </CForm>
          </CCardBody>
        </CCard>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>제품 등록</strong>
          </CCardHeader>
          <CCardBody>
            <p className="text-body-secondary small">
              제품코드 등록시, 기존 제품과 겹치지 않는지 확인 후 입력해주세요.
            </p>
              <CForm className="row g-3">
                <CCol md={1}>
                  <CFormLabel>입고 구분</CFormLabel>
                  <CFormCheck
                      type="radio"
                      name="flexRadioDefault"
                      id="incoming"
                      label="수입"
                  />
                  <CFormCheck
                      type="radio"
                      name="flexRadioDefault"
                      id="outgoing"
                      label="국내"
                      defaultChecked
                  />
                </CCol>
                <CCol md={3}>
                  <CFormLabel>카테고리</CFormLabel>
                  <CFormSelect aria-label="Default select example">
                    <option>Open this select menu</option>
                    <option value="1">One</option>
                    <option value="2">Two</option>
                    <option value="3">Three</option>
                  </CFormSelect>
                </CCol>
                <CCol md={2}>
                  <CFormLabel>제품 코드</CFormLabel>
                  <CFormInput id="inputProductNum" placeholder="00000.00" />
                </CCol>
                <CCol md={4}>
                  <CFormLabel>제품명</CFormLabel>
                  <CFormInput id="newProdName"/>
                </CCol>
                <CCol md={2}>
                  <CFormLabel>분류</CFormLabel>
                  <CFormCheck
                      type="radio"
                      name="flexRadioDefault"
                      id="household"
                      label="가정용"
                      defaultChecked
                  />
                  <CFormCheck
                      type="radio"
                      name="flexRadioDefault"
                      id="gym"
                      label="클럽용"
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel>자동분류명</CFormLabel>
                  <CFormInput id="newProdNickname" placeholder="" />
                </CCol>
                <CCol md={4}>
                  <CFormLabel>공장명</CFormLabel>
                  <CFormInput id="newProdFactory" placeholder="" />
                </CCol>
                <CCol md={4}>
                  <CFormLabel>제품 설명</CFormLabel>
                  <CFormInput id="inputValidation" placeholder="" />
                </CCol>
                <CCol xs={12}>
                  <CButton color="primary" type="submit">
                    확인
                  </CButton>
                </CCol>
              </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default Layout
