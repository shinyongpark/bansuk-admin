import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker'
import Select from 'react-select';
import axios from 'axios';
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
    CRow,
} from '@coreui/react';

const CustomerSupport = () => {
    const companies = ['Company A', 'Company B', 'Company C']
    const products = ['Product A', 'Product B', 'Product C']
    const consultations = ['Type A', 'Type B', 'Type C']
    const [categories, setCategories] = useState([]);

    const [productDetails, setProductDetails] = useState({
        importType: '',
        category: '',
        productCode: '',
        factory: '',
        newProductName: '',
        newNickname: '',
        newComment: '',
        coupang: '',
        validation: '',
        description: '',
        deliveryFee: '',
        containerDeliveryFee: '',
        containerFee: '',
        rocket: false,
        companyName: '',
        productName: '',
        consultationType1: '',
        consultationType2: '',
        startDate: '',
        endDate: '',
        buyerName: '',
        recipientName: '',
        buyerPhone: '',
        recipientPhone: ''
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await axios.get('http://localhost:8080/get-categories');
            // const parsed = response.data.map(item => `${item.id}: ${item.name}`);
            const parsed = response.data.map(item => ({
                value: `${item.id}: ${item.name}`,
                label: `${item.id}: ${item.name}`,
            }));
            setCategories(parsed);
            // console.log("parsed list", parsed);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleChange = (e) => {
        setProductDetails({
            ...productDetails,
            [e.target.name]: e.target.value,
        });
    };

    const handleSelectChange = (selectedOption, { name }) => {
        setProductDetails({
            ...productDetails,
            [name]: selectedOption,
        });
    };

    const handleView = (e) => {
        e.preventDefault();
        handleSearch(productDetails);
    };

    return (
        <CRow>
            <CCol xs={12}>
                <CCard className="mb-4">
                    <CCardHeader>
                        <strong>주문 검색</strong>
                    </CCardHeader>
                    <CCardBody>
                        <CForm className="row g-3">
                            {/* 업체명 */}
                            <CCol md={4}>
                                <CFormLabel>업체명</CFormLabel>
                                <Select
                                    name="companyName"
                                    options={companies.map(category => ({ value: category.id, label: category.name }))}
                                    onChange={handleSelectChange}
                                    isSearchable
                                />
                            </CCol>

                            {/* 주소 */}
                            <CCol md={4}>
                                <CFormLabel>주소</CFormLabel>
                                <CFormInput name="address" placeholder="주소 입력" onChange={handleChange} />
                            </CCol>

                            {/* 상품명 */}
                            <CCol md={4}>
                                <CFormLabel>상품명</CFormLabel>
                                <Select
                                    name="productName"
                                    options={categories}
                                    onChange={handleSelectChange}
                                    isSearchable
                                />
                            </CCol>

                            {/* 상담구분 */}
                            <CCol md={4}>
                                <CFormLabel>상담구분</CFormLabel>
                                <div className="d-flex align-items-center">
                                    <div style={{ flex: 3, marginRight: '0.5rem' }}>
                                        <Select
                                            name="consultationType1"
                                            options={consultations.map(category => ({ value: category.id, label: category.name }))}
                                            onChange={handleSelectChange}
                                            placeholder="상담구분"
                                            isSearchable
                                        />
                                    </div>
                                    <div style={{ flex: 2 }}>
                                        <Select
                                            name="consultationType2"
                                            options={consultations.map(category => ({ value: category.id, label: category.name }))}
                                            onChange={handleSelectChange}
                                            placeholder="구분"
                                            isSearchable
                                        />
                                    </div>
                                </div>
                            </CCol>

                            {/* 발송기간 */}
                            <CCol md={4}>
                                <CFormLabel>발송기간</CFormLabel>
                                <div className="d-flex align-items-center">
                                    <div style={{ flex: 2.5, marginRight: '0.5rem' }}>
                                        <DatePicker
                                            selected={productDetails.startDate}
                                            onChange={date => setProductDetails({ ...productDetails, startDate: date })}
                                            dateFormat="yyyy-MM-dd"
                                            placeholderText="시작: YYYY-MM-DD"
                                        />
                                    </div>
                                    <div style={{ flex: 2.5 }}>
                                        <DatePicker
                                            selected={productDetails.startDate}
                                            onChange={date => setProductDetails({ ...productDetails, startDate: date })}
                                            dateFormat="yyyy-MM-dd"
                                            placeholderText="종료: YYYY-MM-DD"
                                        />
                                    </div>
                                </div>
                            </CCol>

                            {/* 구매인명 */}
                            <CCol md={8}>
                                <div className="d-flex flex-wrap">
                                    <div style={{ flex: 3, marginRight: '0.5rem' }}>
                                        <CFormLabel>구매인명</CFormLabel>
                                        <CFormInput name="buyerName" placeholder="성함" onChange={handleChange} />
                                    </div>
                                    <div style={{ flex: 2, marginRight: '0.5rem' }}>
                                        <CFormLabel>구매인전화번호</CFormLabel>
                                        <CFormInput name="buyerPhone" placeholder="전화번호 4자리" onChange={handleChange} />
                                    </div>

                                    <div style={{ flex: 3, marginRight: '0.5rem' }}>
                                        <CFormLabel>수취인명</CFormLabel>
                                        <CFormInput name="recipientName" placeholder="성함" onChange={handleChange} />
                                    </div>
                                    <div style={{ flex: 2, marginRight: '0.5rem' }}>
                                        <CFormLabel>수취인전화번호</CFormLabel>
                                        <CFormInput name="recipientPhone" placeholder="전화번호 4자리" onChange={handleChange} />
                                    </div>
                                </div>
                            </CCol>
                            {/* 조회 버튼 */}
                            <CCol xs={12}>
                                <CButton color="primary" type="submit" onClick={handleView}>조회 </CButton>
                            </CCol>
                        </CForm>

                        {/* 결과 테이블 */}
                        <div className="table-responsive mt-4">
                            <table className="table table-striped">
                                <thead>
                                    <tr>
                                        <th>업체</th>
                                        <th>발송일자</th>
                                        <th>구매인</th>
                                        <th>수취인</th>
                                        <th>전화번호1</th>
                                        <th>전화번호2</th>
                                        <th>상품명</th>
                                        <th>송장번호</th>
                                        <th>요구사항</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Replace this with your data */}
                                    {/* Example row */}
                                    <tr>
                                        <td>업체1</td>
                                        <td>2024-09-13</td>
                                        <td>홍길동</td>
                                        <td>김철수</td>
                                        <td>010-1234-5678</td>
                                        <td>010-9876-5432</td>
                                        <td>상품A</td>
                                        <td>1234567890</td>
                                        <td>빠른배송 부탁드립니다</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </CCardBody>
                </CCard>
            </CCol>
        </CRow>
    );
};

export default CustomerSupport
