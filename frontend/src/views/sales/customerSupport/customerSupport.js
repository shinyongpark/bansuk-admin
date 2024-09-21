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
    // const products = ['Product A', 'Product B', 'Product C']
    const [products, setProducts] = useState([]);
    const [newConsultations, setNewConsultations] = useState([]);
    // const [consultations, setConsultations] = useState([]);
    const [consultations_type1, setConsultations_type1] = useState([]);
    const [consultations_type2, setConsultations_type2] = useState([]);
    // const [tableData, setTableData] = useState([]);
    const [selectedRow, setSelectedRow] = useState(null);
    const [selectedRow_Consult, setSelectedRow_Consult] = useState(null);
    const tableData = [
        {
            company: 'Company A',
            sendDate: '2024-09-01',
            buyerName: 'John Doe',
            recipientName: 'Jane Smith',
            buyerPhone1: '010-1234-5678',
            recipientPhone1: '010-8765-4321',
            productName: 'Product A',
            invoiceNo: 'INV12345',
            request: 'No special requests',
            deliveryFeeType: 'Prepaid',
            supplyPrice: '10000',
            salePrice: '12000',
            paymentAmount: '12000',
            buyerPhone2: '010-5678-1234',
            recipientPhone2: '010-4321-8765',
            productNo: 'PRD1001',
            orderNo: 'ORD2001',
            postalCode: '12345',
            address: '123 Main St, City A'
        },
        {
            company: 'Company B',
            sendDate: '2024-09-02',
            buyerName: 'Alice Johnson',
            recipientName: 'Bob Williams',
            buyerPhone1: '010-9876-5432',
            recipientPhone1: '010-6543-7890',
            productName: 'Product B',
            invoiceNo: 'INV12346',
            request: 'Gift wrap',
            deliveryFeeType: 'COD',
            supplyPrice: '15000',
            salePrice: '17000',
            paymentAmount: '17000',
            buyerPhone2: '010-5432-9876',
            recipientPhone2: '010-7890-6543',
            productNo: 'PRD1002',
            orderNo: 'ORD2002',
            postalCode: '54321',
            address: '456 Oak St, City B'
        },
        // Add more rows similarly...
        {
            company: 'Company C',
            sendDate: '2024-09-03',
            buyerName: 'Charlie Brown',
            recipientName: 'Lucy Van Pelt',
            buyerPhone1: '010-1111-2222',
            recipientPhone1: '010-3333-4444',
            productName: 'Product C',
            invoiceNo: 'INV12347',
            request: 'Handle with care',
            deliveryFeeType: 'Prepaid',
            supplyPrice: '20000',
            salePrice: '22000',
            paymentAmount: '22000',
            buyerPhone2: '010-2222-1111',
            recipientPhone2: '010-4444-3333',
            productNo: 'PRD1003',
            orderNo: 'ORD2003',
            postalCode: '11111',
            address: '789 Pine St, City C'
        },
        {
            company: 'Company D',
            sendDate: '2024-09-04',
            buyerName: 'David Kim',
            recipientName: 'Emma Lee',
            buyerPhone1: '010-5555-6666',
            recipientPhone1: '010-7777-8888',
            productName: 'Product D',
            invoiceNo: 'INV12348',
            request: 'Leave at the door',
            deliveryFeeType: 'COD',
            supplyPrice: '5000',
            salePrice: '7000',
            paymentAmount: '7000',
            buyerPhone2: '010-6666-5555',
            recipientPhone2: '010-8888-7777',
            productNo: 'PRD1004',
            orderNo: 'ORD2004',
            postalCode: '22222',
            address: '321 Cedar St, City D'
        },
        {
            company: 'Company E',
            sendDate: '2024-09-05',
            buyerName: 'Olivia Jones',
            recipientName: 'Ethan Thomas',
            buyerPhone1: '010-9999-0000',
            recipientPhone1: '010-1234-4321',
            productName: 'Product E',
            invoiceNo: 'INV12349',
            request: 'Call before delivery',
            deliveryFeeType: 'Prepaid',
            supplyPrice: '30000',
            salePrice: '32000',
            paymentAmount: '32000',
            buyerPhone2: '010-0000-9999',
            recipientPhone2: '010-4321-1234',
            productNo: 'PRD1005',
            orderNo: 'ORD2005',
            postalCode: '33333',
            address: '654 Birch St, City E'
        },
        {
            company: 'Company F',
            sendDate: '2024-09-06',
            buyerName: 'Sophia Martinez',
            recipientName: 'Liam Gonzalez',
            buyerPhone1: '010-2468-1357',
            recipientPhone1: '010-8642-7531',
            productName: 'Product F',
            invoiceNo: 'INV12350',
            request: 'Deliver to office',
            deliveryFeeType: 'COD',
            supplyPrice: '25000',
            salePrice: '27000',
            paymentAmount: '27000',
            buyerPhone2: '010-1357-2468',
            recipientPhone2: '010-7531-8642',
            productNo: 'PRD1006',
            orderNo: 'ORD2006',
            postalCode: '44444',
            address: '987 Willow St, City F'
        },
        {
            company: 'Company G',
            sendDate: '2024-09-07',
            buyerName: 'Mason Robinson',
            recipientName: 'Sophia Davis',
            buyerPhone1: '010-4321-8765',
            recipientPhone1: '010-8765-4321',
            productName: 'Product G',
            invoiceNo: 'INV12351',
            request: 'Fragile item',
            deliveryFeeType: 'Prepaid',
            supplyPrice: '40000',
            salePrice: '42000',
            paymentAmount: '42000',
            buyerPhone2: '010-8765-4321',
            recipientPhone2: '010-4321-8765',
            productNo: 'PRD1007',
            orderNo: 'ORD2007',
            postalCode: '55555',
            address: '123 Cherry St, City G'
        },
        {
            company: 'Company H',
            sendDate: '2024-09-08',
            buyerName: 'Michael Clark',
            recipientName: 'Ava Lewis',
            buyerPhone1: '010-5555-7777',
            recipientPhone1: '010-8888-6666',
            productName: 'Product H',
            invoiceNo: 'INV12352',
            request: 'Next day delivery',
            deliveryFeeType: 'COD',
            supplyPrice: '35000',
            salePrice: '37000',
            paymentAmount: '37000',
            buyerPhone2: '010-7777-5555',
            recipientPhone2: '010-6666-8888',
            productNo: 'PRD1008',
            orderNo: 'ORD2008',
            postalCode: '66666',
            address: '321 Maple St, City H'
        },
        // Additional rows for testing purposes...
        {
            company: 'Company I',
            sendDate: '2024-09-09',
            buyerName: 'Isabella Hall',
            recipientName: 'James Allen',
            buyerPhone1: '010-1357-9753',
            recipientPhone1: '010-5317-3579',
            productName: 'Product I',
            invoiceNo: 'INV12353',
            request: 'No signature required',
            deliveryFeeType: 'Prepaid',
            supplyPrice: '45000',
            salePrice: '47000',
            paymentAmount: '47000',
            buyerPhone2: '010-9753-1357',
            recipientPhone2: '010-3579-5317',
            productNo: 'PRD1009',
            orderNo: 'ORD2009',
            postalCode: '77777',
            address: '654 Elm St, City I'
        },
        {
            company: 'Company J',
            sendDate: '2024-09-10',
            buyerName: 'Amelia Carter',
            recipientName: 'Ethan Collins',
            buyerPhone1: '010-8642-4684',
            recipientPhone1: '010-4864-2468',
            productName: 'Product J',
            invoiceNo: 'INV12354',
            request: 'Deliver in the evening',
            deliveryFeeType: 'COD',
            supplyPrice: '50000',
            salePrice: '52000',
            paymentAmount: '52000',
            buyerPhone2: '010-2468-8642',
            recipientPhone2: '010-8642-4864',
            productNo: 'PRD1010',
            orderNo: 'ORD2010',
            postalCode: '88888',
            address: '987 Spruce St, City J'
        },
        // Repeat similarly for rows up to 20+ entries...
    ];

    const consultations = [
        {
            consultationType: 'TypeA',
            result: '성공',
            consultationTime: '2024-09-20 10:00',
            completionTime: '2024-09-20 10:30',
            content: '내용 A',
            consultant: '상담원 A',
        },
        {
            consultationType: 'TypeB',
            result: '실패',
            consultationTime: '2024-09-21 11:00',
            completionTime: '2024-09-21 11:30',
            content: '내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 \
            B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B',
            consultant: '상담원 B',
        },
        {
            consultationType: 'TypeB',
            result: '진행중',
            consultationTime: '2024-09-21 11:00',
            completionTime: '2024-09-21 11:30',
            content: '내용 B',
            consultant: '상담원 B',
        },
        {
            consultationType: 'TypeB',
            result: '보류',
            consultationTime: '2024-09-21 11:00',
            completionTime: '2024-09-21 11:30',
            content: '내용 B',
            consultant: '상담원 B',
        },
        {
            consultationType: 'TypeB',
            result: '보류',
            consultationTime: '2024-09-21 11:00',
            completionTime: '2024-09-21 11:30',
            content: '내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 \
            B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 \
            B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B내용 B',
            consultant: '상담원 B',
        },
    ];

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
        fetchProductList();
    }, []);

    const fetchProductList = async () => {
        try {
            const response = await axios.get('http://localhost:8080/get-products-list');
            // const parsed = response.data.map(item => `${item.id}: ${item.name}`);
            const parsed = response.data.map(item => ({
                value: `${item.cate_id}: ${item.good_id}, ${item.good_name}`,
                label: `${item.cate_id}: ${item.good_id}, ${item.good_name}`,
            }));
            setProducts(parsed);
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
    const handleCheckboxChange = (row) => {
        setNewConsultations({
            ...newConsultations,
            consultationTime: new Date().toLocaleString(),
        });
        setSelectedRow(selectedRow === row ? null : row);
    };
    const handleView = (e) => {
        e.preventDefault();
        try {
            // const response = await axios.post('http://localhost:8080/api/search', productDetails);
            // Update the table data with the response
            // setTableData(response.data);  // assuming `response.data` is the array of results
            console.log("set table")
        } catch (error) {
            console.error('Error fetching data:', error);
        }

    };


    const handleChange_Consult = (e) => {
        setProductDetails({
            ...newConsultations,
            [e.target.name]: e.target.value,
        });
    };
    const handleSelectChange_Consult = (selectedOption, { name }) => {
        setProductDetails({
            ...newConsultations,
            [name]: selectedOption,
        });
    };
    const handleCheckboxChange_Consult = (row) => {
        setSelectedRow_Consult(selectedRow_Consult === row ? null : row);
    };

    const handleConsulation = () => {
        setNewConsultations({
            ...newConsultations,
            completionTime: new Date().toLocaleString(),
        });
    };

    const getRowClassConsultation = (result) => {
        switch (result) {
            case '성공':
                return 'success-row';
            case '실패':
                return 'failure-row';
            case '진행중':
                return 'in-progress-row';
            default:
                return 'other';
        }
    };

    const handleASView = (e) => {
        e.preventDefault();
    };

    return (
        <CRow>
            <CCol xs={12}>
                <CCard className="mb-4">
                    <CCardHeader>
                        <strong>주문 검색</strong>
                    </CCardHeader>
                    <CCardBody>  {/* Opening tag for CCardBody */}
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
                                    options={products}
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
                                            options={consultations_type1.map(category => ({ value: category.id, label: category.name }))}
                                            onChange={handleSelectChange}
                                            placeholder="상담구분"
                                            isSearchable
                                        />
                                    </div>
                                    <div style={{ flex: 2 }}>
                                        <Select
                                            name="consultationType2"
                                            options={consultations_type2.map(category => ({ value: category.id, label: category.name }))}
                                            onChange={handleSelectChange}
                                            placeholder="처리결과"
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
                                            selected={productDetails.endDate}
                                            onChange={date => setProductDetails({ ...productDetails, endDate: date })}
                                            dateFormat="yyyy-MM-dd"
                                            placeholderText="종료: YYYY-MM-DD"
                                        />
                                    </div>
                                </div>
                            </CCol>

                            <CCol md={2}>
                                <CFormLabel>AS팀</CFormLabel>
                                <div className="d-flex align-items-center">
                                    <CButton color="dark" type="button" onClick={handleASView}>처리현황 조회</CButton>
                                </div>
                            </CCol>

                            <CCol md={2}>
                                <CFormLabel>첨부파일</CFormLabel>
                                <div className="d-flex align-items-center">
                                    <CButton color="dark" type="button" onClick={handleASView}>파일 선택</CButton>
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

                            <CCol md={4}>
                                <CFormLabel>주문서 저장 및 재고 파악</CFormLabel>
                                <div className="d-flex align-items-center">
                                    <CButton color="dark" type="button" onClick={handleASView}>TEST</CButton>
                                </div>
                            </CCol>

                            {/* 조회 버튼 */}
                            <CCol xs={12}>
                                <CButton color="primary" type="submit" onClick={handleView}>조회 </CButton>
                            </CCol>
                        </CForm>

                        {/* 결과 테이블 */}
                        <div style={{ height: '300px', overflowY: 'scroll' }}>
                            <table className="table table-striped">
                                <thead>
                                    <tr>
                                        <th> </th>
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
                                    {tableData.map((row) => (
                                        <tr
                                            key={row.invoiceNo}
                                            className={selectedRow === row ? "selected-row" : ""}
                                        >
                                            <td>
                                                <CFormCheck
                                                    type="radio"
                                                    onChange={() => handleCheckboxChange(row)}
                                                    checked={selectedRow === row}
                                                />
                                            </td>
                                            <td>{row.company}</td>
                                            <td>{row.sendDate}</td>
                                            <td>{row.buyerName}</td>
                                            <td>{row.recipientName}</td>
                                            <td>{row.buyerPhone1}</td>
                                            <td>{row.recipientPhone1}</td>
                                            <td>{row.productName}</td>
                                            <td>{row.invoiceNo}</td>
                                            <td>{row.request}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {selectedRow && (
                            <div style={{ padding: '1rem' }}>
                                <h4 className="custom-header">주문서 상품정보 및 요구사항</h4>

                                <div className="d-flex justify-content-between mb-3">
                                    <div style={{ flex: 1 }}>
                                        <div className="d-flex align-items-center">
                                            <p style={{ margin: 0 }}>주문 업체명:</p>
                                            <div className="info-box">{selectedRow.company}</div>
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div className="d-flex align-items-center">
                                            <p style={{ margin: 0 }}>발송일자:</p>
                                            <div className="info-box">{selectedRow.sendDate}</div>
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div className="d-flex align-items-center">
                                            <p style={{ margin: 0 }}>배송비구분:</p>
                                            <div className="info-box">{selectedRow.deliveryFeeType}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="d-flex justify-content-between mb-3">
                                    <div style={{ flex: 1 }}>
                                        <div className="d-flex align-items-center">
                                            <p style={{ margin: 0 }}>상품명:</p>
                                            <div className="info-box">{selectedRow.productName}</div>
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div className="d-flex align-items-center">
                                            <p style={{ margin: 0 }}>배송비:</p>
                                            <div className="info-box">{selectedRow.deliveryFeeType}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="d-flex justify-content-between mb-3">
                                    <div style={{ flex: 1 }}>
                                        <div className="d-flex align-items-center">
                                            <p style={{ margin: 0 }}>요구사항:</p>
                                            <div className="info-box">{selectedRow.request}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="d-flex justify-content-between mb-3">
                                    <div style={{ flex: 1 }}>
                                        <div className="d-flex align-items-center">
                                            <p style={{ margin: 0 }}>공급금액:</p>
                                            <div className="info-box">{selectedRow.supplyPrice}</div>
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div className="d-flex align-items-center">
                                            <p style={{ margin: 0 }}>판매금액:</p>
                                            <div className="info-box">{selectedRow.salePrice}</div>
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div className="d-flex align-items-center">
                                            <p style={{ margin: 0 }}>결제금액:</p>
                                            <div className="info-box">{selectedRow.paymentAmount}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="d-flex justify-content-between mb-3">
                                    {/* 구매인정보 */}
                                    <div style={{ flex: 1, marginRight: '10px' }}>
                                        <h5 className="custom-header">구매자 정보</h5>
                                        <div className="d-flex justify-content-between mb-3">
                                            <div style={{ flex: 1 }}>
                                                <div className="d-flex align-items-center">
                                                    <p style={{ margin: 0 }}>구매자:</p>
                                                    <div className="info-box">{selectedRow.buyerName}</div>
                                                </div>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div className="d-flex align-items-center">
                                                    <p style={{ margin: 0 }}>송장번호:</p>
                                                    <div className="info-box">{selectedRow.invoiceNo}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="d-flex justify-content-between mb-3">
                                            <div style={{ flex: 1 }}>
                                                <div className="d-flex align-items-center">
                                                    <p style={{ margin: 0 }}>전화번호1:</p>
                                                    <div className="info-box">{selectedRow.buyerPhone1}</div>
                                                </div>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div className="d-flex align-items-center">
                                                    <p style={{ margin: 0 }}>전화번호2:</p>
                                                    <div className="info-box">{selectedRow.buyerPhone1}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="d-flex justify-content-between mb-3">
                                            <div style={{ flex: 1 }}>
                                                <div className="d-flex align-items-center">
                                                    <p style={{ margin: 0 }}>상품번호:</p>
                                                    <div className="info-box">{selectedRow.productNo}</div>
                                                </div>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div className="d-flex align-items-center">
                                                    <p style={{ margin: 0 }}>주문번호:</p>
                                                    <div className="info-box">{selectedRow.orderNo}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 수취인 정보 */}
                                    <div style={{ flex: 1 }}>
                                        <h5 className="custom-header">수취인 정보</h5>
                                        <div className="d-flex justify-content-between mb-3">
                                            <div style={{ flex: 1 }}>
                                                <div className="d-flex align-items-center">
                                                    <p style={{ margin: 0 }}>수취인:</p>
                                                    <div className="info-box">{selectedRow.recipientName}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="d-flex justify-content-between mb-3">
                                            <div style={{ flex: 1 }}>
                                                <div className="d-flex align-items-center">
                                                    <p style={{ margin: 0 }}>전화번호1:</p>
                                                    <div className="info-box">{selectedRow.recipientPhone1}</div>
                                                </div>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div className="d-flex align-items-center">
                                                    <p style={{ margin: 0 }}>전화번호2:</p>
                                                    <div className="info-box">{selectedRow.recipientPhone1}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="d-flex justify-content-between mb-3">
                                            <div style={{ flex: 1 }}>
                                                <div className="d-flex align-items-center">
                                                    <p style={{ margin: 0 }}>우편번호:</p>
                                                    <div className="info-box">{selectedRow.postalCode}</div>
                                                </div>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div className="d-flex align-items-center">
                                                    <p style={{ margin: 0 }}>주소:</p>
                                                    <div className="info-box">{selectedRow.address}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <h4 className="custom-header-consultation">고객 상담 내역 등록하기</h4>
                                <CForm>
                                    <CRow className="mb-3">
                                        <CCol md={2}>
                                            <CFormLabel>상담구분</CFormLabel>
                                            <Select
                                                options={consultations_type1.map(type => ({ value: type, label: type }))}
                                                onChange={handleSelectChange_Consult}
                                                isSearchable
                                            />
                                        </CCol>
                                        <CCol md={2}>
                                            <CFormLabel>처리결과</CFormLabel>
                                            <Select
                                                options={consultations_type2.map(result => ({ value: result, label: result }))}
                                                onChange={handleSelectChange_Consult}
                                                isSearchable
                                            />
                                        </CCol>
                                        <CCol md={4}>
                                            <CFormLabel>상담시간</CFormLabel>
                                            <CFormInput type="text" value={newConsultations.consultationTime} readOnly />
                                        </CCol>
                                        <CCol md={4}>
                                            <CFormLabel>완료시간</CFormLabel>
                                            <CFormInput type="text" value={newConsultations.completionTime} placeholder='등록시 자동으로 기재됩니다' readOnly />
                                        </CCol>
                                    </CRow>
                                    <CRow className="mb-3">
                                        <CCol md={12}>
                                            <CFormLabel>상담내용</CFormLabel>
                                            <textarea
                                                name="content"
                                                placeholder="상담 내용을 입력하세요"
                                                onChange={handleChange_Consult}
                                                style={{
                                                    height: '100px', // Set a fixed height
                                                    overflowY: 'auto', // Enable vertical scrolling
                                                    width: '100%', // Ensure it takes full width
                                                    border: '1px solid #ced4da', // Match CoreUI's input styling
                                                    borderRadius: '0.25rem', // Match CoreUI's input styling
                                                    padding: '0.375rem 0.75rem', // Match CoreUI's input styling
                                                    resize: 'none', // Prevent resizing
                                                }}
                                            />
                                        </CCol>
                                    </CRow>
                                    <CRow className="mb-3">
                                        <CCol>
                                            <CButton color="primary" onClick={handleConsulation}>등록</CButton>
                                        </CCol>
                                    </CRow>
                                </CForm>

                                <h4 className="custom-header-consultation">기존 상담내역 (상담시간 기준 오름차순)</h4>
                                <div style={{ height: '200px', overflowY: 'scroll' }}>
                                    <table className="custom-table">
                                        <thead>
                                            <tr>
                                                <th> </th>
                                                <th style={{ width: '8%' }}>상담구분</th>
                                                <th style={{ width: '7%' }}>상태</th>
                                                <th style={{ width: '15%' }}>상담시간</th>
                                                <th style={{ width: '15%' }}>완료시간</th>
                                                <th style={{ width: '45%' }}>상담내용</th>
                                                <th style={{ width: '10%' }}>상담원</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {consultations.map((row, index) => (
                                                <tr key={index} className={getRowClassConsultation(row.result)}>
                                                    <td>
                                                        <CFormCheck
                                                            type="radio"
                                                            onChange={() => handleCheckboxChange_Consult(row)}
                                                            checked={selectedRow_Consult === row}
                                                        />
                                                    </td>
                                                    <td>{row.consultationType}</td>
                                                    <td>{row.result}</td>
                                                    <td>{row.consultationTime}</td>
                                                    <td>{row.completionTime}</td>
                                                    <td>{row.content}</td>
                                                    <td>{row.consultant}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/* <div className="table-container">
                                    <table className="custom-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '4%' }}>체크</th>
                                                <th style={{ width: '8%' }}>상담구분</th>
                                                <th style={{ width: '8%' }}>상태</th>
                                                <th style={{ width: '10%' }}>상담시간</th>
                                                <th style={{ width: '10%' }}>완료시간</th>
                                                <th style={{ width: '50%' }}>상담내용</th>
                                                <th style={{ width: '10%' }}>상담원</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {consultations.map((row, index) => (
                                                <tr key={index} className={getRowClassConsultation(row.result)}>
                                                    <td>
                                                        <CFormCheck
                                                            type="radio"
                                                            onChange={() => handleCheckboxChange_Consult(row)}
                                                            checked={selectedRow_Consult === row}
                                                        />
                                                    </td>
                                                    <td>{row.consultationType}</td>
                                                    <td>{row.result}</td>
                                                    <td>{row.consultationTime}</td>
                                                    <td>{row.completionTime}</td>
                                                    <td>{row.content}</td>
                                                    <td>{row.consultant}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div> */}

                            </div>
                        )}
                    </CCardBody>
                </CCard>
            </CCol>
        </CRow>
    )
}

export default CustomerSupport
