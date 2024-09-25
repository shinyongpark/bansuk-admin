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
    CModal,
    CModalHeader,
    CModalTitle,
    CModalBody,
    CModalFooter,
    CTable,
    CTableHead,
    CTableBody,
    CTableRow,
    CTableHeaderCell,
    CTableDataCell,
    CRow,
    CSpinner
} from '@coreui/react';

const CustomerSupport = () => {
    // page 1 & other option lists
    const [companies, setCompanies] = useState([])
    const [products, setProducts] = useState([]);
    const [listArray, setListArray] = useState([]);
    const [counselSection, setCounselSection] = useState([]);
    const [counselResult, setCounselResult] = useState([]);
    const [staffNames, setStaffNames] = useState([]);
    const [loading, setLoading] = useState(false);

    // page2 show search result
    const [tableData, setTableData] = useState([]);
    const [selectedRow, setSelectedRow] = useState(null); // saves the user selection on page2 for page3
    const [deliveryVisible, setDeliveryVisible] = useState(false); // used for delivery popup visibility
    const [deliveryUrl, setDeliveryUrl] = useState("");

    // page4 show search result for consultations (상담내역)
    const [consultations, setConsultations] = useState([]);
    const [newConsultations, setNewConsultations] = useState([]); // when user sends a new consultation
    const [selectedRow_Consult, setSelectedRow_Consult] = useState(null); // when user selects the consultation

    const [visibleASTable, setVisibleASTable] = useState(false); //used for popup visibility
    const [selectedCounselerASTable, setSelectedCounselerASTable] = useState(""); //store when user picks the counseler/consultant
    const [consultationsAS, setConsultationsAS] = useState([]); // list of AS consultations
    const [consultationsASTable, setConsultationsASTable] = useState([]); // list of AS consultations shown in table
    const [selectedRowASTable, setSelectedRowASTable] = useState(null);

    // file upload - 첨부파일
    const [modalVisible, setModalVisible] = useState(false); //used for popup visibility
    const [selectedFile, setSelectedFile] = useState(null);
    const [error, setError] = useState(''); // print error msg

    //same fields as tableData; kept all fields just for debugging
    const [productDetails, setProductDetails] = useState({
        company: '', //order_company
        productName: '', //상품명 goods_name
        counselSection: '',
        counselResult: '',
        startDate: '',
        endDate: '',
        buyerName: '', //purchaser_name
        buyerPhoneLast4: '',
        recipientName: '', //name
        recipientPhoneLast4: '',
        address: '', //addres


        buyerPhone1: '', //purchaser_tel1
        buyerPhone2: '', //purchaser_tel2
        recipientPhone1: '',//tel1
        recipientPhone2: '', //tel2
        postalCode: '', //zip_code
        productNo: '', //goods_serial
        orderNo: '', //order_serial
        deliveryPaymentType: '', //g_external_pay_method[$order[pay_method]]; 배송비 구분
        invoiceNo: '', // invoice_number
        deliveryFee: '',//delivery_cost
        supplyPrice: '', //supply_price
        salePrice: '', //selling_price
        paymentAmount: '', //settlement_price
        request: '', //comments
    });

    // get the lists when open page
    useEffect(() => {
        fetchSelectList();
    }, []);

    // when user selects a row in page2, get all consultatoins(상담내역) for page4
    useEffect(() => {
        if (selectedRow) {
            // console.log("customerService selectedRow: ", selectedRow);
            const fetchConsultations = async () => {
                const response = await axios.post('http://localhost:8080/customer-support/search-consultations', selectedRow, {
                    headers: { 'Content-Type': 'application/json' },
                });
                console.log("cs listArray", listArray)

                const consultations = transformData_counsel(response);
                // console.log("customersupport consultations", consultations)
                setConsultations(consultations);
            };

            fetchConsultations();
        }
    }, [selectedRow]); // Dependency on selectedRow


    // helper functions ///////////////////////////////////////////////////////////////////////////////////
    // get all options for SELECT lists
    const fetchSelectList = async () => {
        try {
            const response = await axios.get('http://localhost:8080/get-select-list');
            // console.log("customerSupport", typeof response, response)
            const parsedCompanies = response.data.order_company.map(item => ({
                value: item,
                label: item === "" ? "미선택" : item
            }))
            setCompanies(parsedCompanies);

            const parsedCounselSection = response.data.counsel_section.map((item, index) => ({
                value: item === "" ? "" : String(index),
                label: item === "" ? "미선택" : item
            }))
            setCounselSection(parsedCounselSection);

            const parsedCounselResult = response.data.counsel_result.map((item, index) => ({
                value: item === "" ? "" : String(index),
                label: item === "" ? "미선택" : item
            }))
            setCounselResult(parsedCounselResult);

            const parsedStaffNames = response.data.staff_name.map(item => ({
                value: item === "모두" ? "" : item,
                label: item
            }))
            setStaffNames(parsedStaffNames);

            const parsedProducts = response.data.product_list.map(item => ({
                value: `${item.good_name}`,
                label: `${item.cate_id}: ${item.good_id}, ${item.good_name}`,
            }));
            const allProducts = [
                { value: "", label: "미선택" },
                ...parsedProducts
            ];
            setProducts(allProducts);

            setListArray(response.data)
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    // change counsel data fields from DB to web
    const transformData_counsel = (response) => {
        const counselResult_m = ["상태 확인", "완료"];
        console.log(response.data)
        return response.data.map(item => ({
            id: item.uid,  // Corresponding field from DB
            startDate: item.reg_date.split('T')[0],  // Format date
            endDate: item.end_date.split('T')[0],  // Format date
            counselSection: item.table === "c" ? listArray.counsel_section[Number(item.counsel_section)] : counselResult_m[Number(item.proceed)],  // Assuming this corresponds to category
            inputer: item.table === "c" ? item.counseler : item.manager, // m.manager or c.counseler
            counselResult: listArray.counsel_result[Number(item.counsel_result)],
            content: item.counsel_content,
        }));
    };

    // change external buyer data fields from DB to web
    const transformData_external = (response) => response.data.map(item => ({
        company: item.order_company || '',
        group_uid: item.group_uid,
        uid: item.uid,
        productName: item.goods_name || '',
        counselSection: item.counsel_section || '',
        counselResult: item.counsel_result || '',
        startDate: item.reg_date.split('T')[0] || '',
        buyerName: item.purchaser_name || '',
        buyerPhoneLast4: item.purchaser_tel1?.slice(-4) || '',
        recipientName: item.name || '',
        recipientPhoneLast4: item.tel1?.slice(-4) || '',
        buyerPhone1: item.purchaser_tel1 || '',
        buyerPhone2: item.purchaser_tel2 || '',
        recipientPhone1: item.tel1 || '',
        recipientPhone2: item.tel2 || '',
        postalCode: item.zip_code || '',
        address: item.address || '',
        productNo: item.goods_serial || '', //상품번호
        orderNo: item.order_serial || '', //주문번호
        deliveryPaymentType: listArray.external_pay_method[Number(item.pay_method)] || '',
        invoiceNo: item.invoice_number || '', //송장번호
        deliveryFee: item.delivery_cost || '',
        supplyPrice: item.supply_price || '', //공급금액
        salePrice: item.selling_price || '',  //판매금액
        paymentAmount: item.settlement_price || '', //결제금액
        request: item.comments || '',
        group_uid: item.group_uid || '',
    }));

    // getting url from invoiceNo for delivery status
    function getDeliveryUrl(invoiceNo, regDate) {
        let delCom = "no";
        invoiceNo = invoiceNo.replace(/-/g, ""); // Remove dashes

        if (!isNaN(invoiceNo)) {
            const invoiceLen = invoiceNo.length;

            if (invoiceLen === 9 || invoiceLen === 10) {
                const a = parseInt(invoiceNo.slice(0, invoiceLen - 1), 10);
                const b = parseInt(invoiceNo[invoiceLen - 1], 10);

                if ((a % 7) === b) {
                    delCom = "ok"; // 한진
                }

                const pre = invoiceNo.substring(0, 2);
                const regDateTimestamp = new Date(regDate).getTime();
                const cutOffDate = new Date("2008-08-04").getTime();

                if ((pre === "60" && regDateTimestamp > cutOffDate) || pre === "67" || pre === "68") {
                    // Do nothing; logic for 'aju' not included here
                }
            } else if (invoiceLen === 11) {
                delCom = "CI";
            }

            const newNum = invoiceNo;

            // 송장번호 12자리 / 시작번호 5
            if (newNum.length === 12 && newNum.startsWith("5")) {
                delCom = "CJ";
            }

            // 송장번호 12자리 / 시작번호 4
            if (newNum.length === 12 && newNum.startsWith("4")) {
                delCom = "HJ";
            }

            if (invoiceLen === 10) {
                delCom = "KGB";
            }

            if (invoiceLen === 13) {
                delCom = "KD";
            }

            // Logic for different delivery companies based on prefixes
            let deliveryUrl = "";

            if (invoiceNo.startsWith("8") && invoiceLen !== 11) { // 하나로 택배
                if (!invoiceNo.includes("-")) {
                    invoiceNo = `${invoiceNo.substring(0, 3)}-${invoiceNo.substring(3, 7)}-${invoiceNo.substring(7, 10)}`;
                }
                deliveryUrl = `http://www.hanarologis.com/branch/chase/listbody.html?a_gb=center&a_cd=4&a_item=0&fr_slipno=${invoiceNo}`;
            } else if (invoiceNo.startsWith("22")) { // SEDEX
                deliveryUrl = `http://ptop.sedex.co.kr:8080/jsp/tr/detailSheet.jsp?iSheetNo=${invoiceNo}`;
            } else if (delCom === "HJ") { // 한진택배
                deliveryUrl = `https://www.hanjin.co.kr/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&wblnum=${invoiceNo}&schLang=KR&wblnumText=`;
            } else if (delCom === "aju") { // 아주 택배
                deliveryUrl = `javascript:submit_trade('${invoiceNo}')`; // Assuming a JS function call
                console.log("아주 택배는 패턴이 없습니다..")
                return null
            } else if (delCom === "dongbu") {
                deliveryUrl = `http://www.kglogis.co.kr/delivery/delivery_result.jsp?item_no=${invoiceNo}`;
            } else if (delCom === "CJ") {
                deliveryUrl = `https://www.doortodoor.co.kr/parcel/doortodoor.do?fsp_action=PARC_ACT_002&fsp_cmd=retrieveInvNoACT&invc_no=${invoiceNo}`;
            } else if (delCom === "KGB") {
                deliveryUrl = `http://www.kgbls.co.kr/sub5/trace.asp?f_slipno=${invoiceNo}`;
            } else if (delCom === "yellow") {
                deliveryUrl = `http://www.yellowcap.co.kr/custom/inquiry_result.asp?INVOICE_NO=${invoiceNo}`;
            } else if (delCom === "KD") {
                deliveryUrl = `https://kdexp.com/service/delivery/etc/delivery.do?barcode=${invoiceNo}`;
            } else if (delCom === "CI") {
                deliveryUrl = `http://www.cyber1001.co.kr/kor/taekbae/HTrace.jsp?transNo=${invoiceNo}`;
            } else {
                deliveryUrl = `http://kdexp.com/delivery.kd?barcode=${invoiceNo}`;
            }

            return deliveryUrl; // Return the URL for tracking
        } else {
            return null; // Invalid invoice number
        }
    }

    // Page 1 : AS 현황 조회: ASTable //////////////////////////////////////////////////////////////////////////////////////////

    const handleCounselerFilterChange = (selectedOption, { name }) => {
        setSelectedCounselerASTable({
            [name]: selectedOption,
        });
    };

    //when user selects the counseler it filters the consultationsAS
    useEffect(() => {
        if (selectedCounselerASTable) {
            // console.log("customerService selectedCounselerASTable: ", selectedCounselerASTable);
            const filteredConsultations = consultationsAS.filter(
                (row) => (selectedCounselerASTable.ASCounseler.value === '' || row.counseler === selectedCounselerASTable.ASCounseler.value)
            );

            setConsultationsASTable(filteredConsultations);
        }
    }, [selectedCounselerASTable]);

    // when the user hits "AS 현황 조회", shows pop up
    const handleASView = async (e) => {
        e.preventDefault();
        setVisibleASTable(!visibleASTable);
        try {
            //get all AS data; when user changes the staffNames list then fliter
            const response = await axios.get('http://localhost:8080/customer-support/search-ASTable');
            const consultations = response.data.map(item => ({
                id: item.uid,
                group_uid: item.group_uid,
                external_uid: item.external_uid,
                startDate: item.reg_date.split('T')[0],  // Format date
                recipient: item.name,
                productName: item.good_name,
                counselResult: item.counsel_result,
                counseler: item.counseler,
                content: item.counsel_content,
                manager: item.manager
            }));

            // Update the state with the transformed data
            setConsultationsASTable(consultations)
            return setConsultationsAS(consultations);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    // when user selects the row, shows on page 2
    const handleCheckboxChangeASTable = async (row) => {
        console.log("handleCheckboxChangeASTable", row)
        setSelectedRowASTable(row);
        const foundSelected = tableData.filter((row_table) => row_table.group_uid === row.group_uid)[0]
        if (foundSelected) {
            setSelectedRow(foundSelected);
        } else {
            console.log(row);
            const response = await axios.post('http://localhost:8080/customer-support/search-ASTable/consultations', row, {
                headers: { 'Content-Type': 'application/json' },
            });
            const transformedData = transformData_external(response);

            // show it to Page2; user will select there
            setTableData(transformedData);
            setSelectedRow(null); // reset the selectedrow to reset the page3 page
        }
        return;
    };



    // Page1: 첨부파일: file upload //////////////////////////////////////////////////////////////////////////////////
    const handleUploadView = () => {
        setModalVisible(true);
        setError(''); // Reset error message
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check if the file is a CSV
            if (file.type !== 'text/csv') {
                setError('Please upload a valid CSV file.');
                setSelectedFile(null); // Reset file input
            } else {
                setError('');
                setSelectedFile(file);
            }
        }
    };

    const handleUpload = () => {
        if (selectedFile) {
            // Implement the upload logic here
            console.log('Uploading file:', selectedFile);
            // Close modal after upload or after you perform the upload operation
            setModalVisible(false);
        }
    };

    // Page1, 2: 검색, 검색결과 ///////////////////////////////////////////////////////////////////////////////////
    // used for text inputs
    const handleChange = (e) => {
        setProductDetails(prevDetails => ({
            ...prevDetails,
            [e.target.name]: e.target.value || '',
        }));
    };
    // used for Select inputs
    const handleSelectChange = (selectedOption, { name }) => {
        setProductDetails({
            ...productDetails,
            [name]: selectedOption,
        });
    };
    // when user selects a row, affects page2, 3
    const handleCheckboxChange = async (row) => {
        setNewConsultations(prevState => ({
            ...prevState,
            consultationTime: new Date().toLocaleString(),
            counseler: sessionStorage.getItem('name')
        }));
        // console.log("handleCheckboxChange, row", row)
        setSelectedRow(selectedRow === row ? null : row)
    };

    // when user hits 조회
    const handleView = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // console.log("customerSupport", productDetails)
            const response = await axios.post('http://localhost:8080/customer-support/search', productDetails, {
                headers: { 'Content-Type': 'application/json' },
            });
            const transformedData = transformData_external(response)

            // Update the state with the transformed data
            setTableData(transformedData);
            setSelectedRow(null);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false); // Hide loading spinner
        }

    };

    // Page2: 배송 조회: delivery popup /////////////////////////////////////////////////////////////////////////////
    const handleInvoiceClick = (invoiceNo, regDate) => {
        const url = getDeliveryUrl(invoiceNo, regDate);
        setDeliveryUrl(url);
        setDeliveryVisible(true);
    };

    const closeModal = () => {
        setDeliveryVisible(false);
        setDeliveryUrl(""); // Clear the URL when closing the modal
    };

    // Page4: 고객 상담 내역: Consultation Table ///////////////////////////////////////////////////////////////////////
    const handleChange_Consult = (e) => {
        setNewConsultations({
            ...newConsultations,
            [e.target.name]: e.target.value,
        });
    };
    const handleSelectChange_Consult = (selectedOption, { name }) => {
        setNewConsultations({
            ...newConsultations,
            [name]: selectedOption,
        });
    };
    const handleCheckboxChange_Consult = (row) => {
        setSelectedRow_Consult(row);
    };

    // when user submits new consultation 
    const handleConsulation = async () => {
        newConsultations["completionTime"] = new Date().toLocaleString();
        newConsultations["group_uid"] = selectedRow.group_uid;
        newConsultations["external_uid"] = selectedRow.uid;
        try {
            const response = await axios.post('http://localhost:8080/customer-support/submit-consultations', newConsultations, {
                headers: { 'Content-Type': 'application/json' },
                withCredentials: true
            });
            //update consultations in page 4
            const response_search = await axios.post('http://localhost:8080/customer-support/search-consultations', selectedRow, {
                headers: { 'Content-Type': 'application/json' },
            });
            const consultations_new = transformData_counsel(response_search);
            setConsultations(consultations_new);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    // change color coding for page 4 based on counsel_result
    // if want to change color or add new go to frontend/src/scss/_custom.scss
    const getRowClassConsultation = (result) => {
        switch (result) {
            case '성공':
                return 'success-row';
            case '상태 확인':
                return 'failure-row';
            case '반품':
                return 'in-progress-row';
            default:
                return 'other';
        }
    };



    return (
        <CRow>
            <CCol xs={12}>
                {/* ///////////////////////// page1: 주문 검색 start //////////////////////////////////////////////////////////////////////////// */}

                <CCard className="mb-4">
                    <CCardHeader>
                        <strong>주문 검색</strong>
                    </CCardHeader>
                    <CCardBody>  {/* Opening tag for CCardBody */}
                        {loading && (
                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                                <CSpinner color="primary" /> <span style={{ marginLeft: '10px' }}>Loading...</span>
                            </div>
                        )}
                        <CForm className="row g-3">
                            {/* 업체명 */}
                            <CCol md={4}>
                                <CFormLabel>업체명</CFormLabel>
                                <Select
                                    name="company"
                                    options={companies}
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
                                            name="counselSection"
                                            options={counselSection}
                                            onChange={handleSelectChange}
                                            placeholder="상담구분"
                                            isSearchable
                                        />
                                    </div>
                                    <div style={{ flex: 2 }}>
                                        <Select
                                            name="counselResult"
                                            options={counselResult}
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

                            {/* ///////////////////////// page1: AS 현황 검색 start //////////////////////////////////////////////////////////////////////////// */}
                            <CModal visible={visibleASTable} onClose={() => setVisibleASTable(false)} size="xl">
                                <CModalHeader onClose={() => setVisibleASTable(false)}>
                                    <CModalTitle>AS 상담 현황</CModalTitle>
                                </CModalHeader>
                                <CModalBody>
                                    {/* Select Filter */}
                                    <CFormLabel htmlFor="inputer-select">입력자 선택</CFormLabel>
                                    <div style={{ flex: 2.5 }}>
                                        <Select
                                            name="ASCounseler"
                                            options={staffNames}
                                            onChange={handleCounselerFilterChange}
                                            placeholder="모두"
                                            isSearchable
                                            styles={{
                                                control: (base) => ({
                                                    ...base,
                                                    width: '200px' // Set your custom width here
                                                })
                                            }}
                                        />
                                    </div>
                                    {/* Consultation Table; ASTable */}
                                    <div style={{ height: '300px', overflowY: 'scroll' }}>
                                        <CTable hover striped>
                                            <CTableHead>
                                                <CTableRow>
                                                    <CTableHeaderCell></CTableHeaderCell>
                                                    <CTableHeaderCell>날짜</CTableHeaderCell>
                                                    <CTableHeaderCell>수취인</CTableHeaderCell>
                                                    <CTableHeaderCell>제품명</CTableHeaderCell>
                                                    <CTableHeaderCell>분류</CTableHeaderCell>
                                                    <CTableHeaderCell>상담자</CTableHeaderCell>
                                                    <CTableHeaderCell>내용</CTableHeaderCell>
                                                    <CTableHeaderCell>입력자</CTableHeaderCell>
                                                </CTableRow>
                                            </CTableHead>
                                            <CTableBody>
                                                {consultationsASTable.map((row) => (
                                                    <CTableRow key={row.id}>
                                                        <CTableDataCell>
                                                            <CFormCheck
                                                                type="radio"
                                                                onChange={() => handleCheckboxChangeASTable(row)}
                                                                checked={selectedRowASTable === row}
                                                            />
                                                        </CTableDataCell>
                                                        <CTableDataCell>{row.startDate}</CTableDataCell>
                                                        <CTableDataCell>{row.recipient}</CTableDataCell>
                                                        <CTableDataCell>{row.productName}</CTableDataCell>
                                                        <CTableDataCell>{row.counselResult}</CTableDataCell>
                                                        <CTableDataCell>{row.counseler}</CTableDataCell>
                                                        <CTableDataCell>{row.content}</CTableDataCell>
                                                        <CTableDataCell>{row.manager}</CTableDataCell>
                                                    </CTableRow>
                                                ))}
                                            </CTableBody>
                                        </CTable>
                                    </div>
                                    {/* ///////////////////////// page1: AS 현황 검색 end //////////////////////////////////////////////////////////////////////////// */}


                                </CModalBody>
                                <CModalFooter>
                                    <CButton color="secondary" onClick={() => setVisibleASTable(false)}>Close</CButton>
                                </CModalFooter>
                            </CModal>

                            <CCol md={2}>
                                <CFormLabel>첨부파일</CFormLabel>
                                <div className="d-flex align-items-center">
                                    <CButton color="dark" type="button" onClick={handleUploadView}>파일 선택</CButton>
                                </div>
                            </CCol>
                            {/* ///////////////////////// page1: 첨부파일; file upload start //////////////////////////////////////////////////////////////////////////// */}

                            <CModal visible={modalVisible} onClose={() => setModalVisible(false)}>
                                <CModalHeader>
                                    <CModalTitle>Upload CSV File</CModalTitle>
                                </CModalHeader>
                                <CModalBody>
                                    <CFormInput
                                        type="file"
                                        accept=".csv"
                                        onChange={handleFileChange}
                                    />
                                    {error && <div className="text-danger">{error}</div>}
                                </CModalBody>
                                <CModalFooter>
                                    <CButton color="secondary" onClick={() => setModalVisible(false)}>
                                        Close
                                    </CButton>
                                    <CButton color="primary" onClick={handleUpload} disabled={!selectedFile}>
                                        Upload
                                    </CButton>
                                </CModalFooter>
                            </CModal>
                            {/* ///////////////////////// page1: 첨부파일; file upload end //////////////////////////////////////////////////////////////////////////// */}


                            {/* 구매인명 */}
                            <CCol md={8}>
                                <div className="d-flex flex-wrap">
                                    <div style={{ flex: 3, marginRight: '0.5rem' }}>
                                        <CFormLabel>구매인명</CFormLabel>
                                        <CFormInput name="buyerName" placeholder="성함" onChange={handleChange} />
                                    </div>
                                    <div style={{ flex: 2, marginRight: '0.5rem' }}>
                                        <CFormLabel>구매인전화번호</CFormLabel>
                                        <CFormInput name="buyerPhoneLast4" placeholder="전화번호 4자리" onChange={handleChange} />
                                    </div>

                                    <div style={{ flex: 3, marginRight: '0.5rem' }}>
                                        <CFormLabel>수취인명</CFormLabel>
                                        <CFormInput name="recipientName" placeholder="성함" onChange={handleChange} />
                                    </div>
                                    <div style={{ flex: 2, marginRight: '0.5rem' }}>
                                        <CFormLabel>수취인전화번호</CFormLabel>
                                        <CFormInput name="recipientPhoneLast4" placeholder="전화번호 4자리" onChange={handleChange} />
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
                        {/* ///////////////////////// page1: 주문 검색 end //////////////////////////////////////////////////////////////////////////// */}


                        {/* ///////////////////////// page2: 결과 화면; tableData start //////////////////////////////////////////////////////////////////////////// */}

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
                                    {tableData.map((row, index) => (
                                        <tr
                                            key={index}
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
                                            <td>{row.startDate}</td>
                                            <td>{row.buyerName}</td>
                                            <td>{row.recipientName}</td>
                                            <td>{row.buyerPhone1}</td>
                                            <td>{row.recipientPhone1}</td>
                                            <td>{row.productName}</td>
                                            <td>
                                                <span
                                                    style={{ color: 'blue', cursor: 'pointer' }}
                                                    onClick={() => handleInvoiceClick(row.invoiceNo, row.startDate)}
                                                >
                                                    {row.invoiceNo}
                                                </span>
                                            </td>
                                            <td>{row.request}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {/* ///////////////////////// page2: delivery popup start //////////////////////////////////////////////////////////////////////////// */}
                            <CModal visible={deliveryVisible} onClose={closeModal} size="xl">
                                <CModalHeader closeButton>
                                    <CModalTitle>Delivery Tracking</CModalTitle>
                                </CModalHeader>
                                <CModalBody>
                                    {deliveryUrl ? (
                                        <iframe
                                            src={deliveryUrl}
                                            style={{ width: '100%', height: '500px', border: 'none' }}
                                            title="Delivery Tracking"
                                        ></iframe>
                                    ) : (
                                        <p>No URL available for this invoice.</p>
                                    )}
                                </CModalBody>
                                <CButton color="secondary" onClick={closeModal}>Close</CButton>
                            </CModal>
                            {/* ///////////////////////// page2: delivery popup end //////////////////////////////////////////////////////////////////////////// */}

                        </div>
                        {/* ///////////////////////// page2: 결과 화면; tableData end //////////////////////////////////////////////////////////////////////////// */}
                        {/* ///////////////////////// page3: 주문서 상품정보 및 요구사항; selectedRow start //////////////////////////////////////////////////////////////////////////// */}

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
                                            <div className="info-box">{selectedRow.startDate}</div>
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div className="d-flex align-items-center">
                                            <p style={{ margin: 0 }}>배송비구분:</p>
                                            <div className="info-box">{selectedRow.deliveryPaymentType}</div>
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
                                            <div className="info-box">{selectedRow.deliveryFee}</div>
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
                                                    <p style={{ margin: 0 }}>전화번호1:</p>
                                                    <div className="info-box">{selectedRow.buyerPhone1}</div>
                                                </div>
                                            </div>

                                        </div>
                                        <div className="d-flex justify-content-between mb-3">
                                            <div style={{ flex: 1 }}>
                                                <div className="d-flex align-items-center">
                                                    <p style={{ margin: 0 }}>송장번호:</p>
                                                    <div className="info-box">{selectedRow.invoiceNo}</div>
                                                </div>
                                            </div>

                                            <div style={{ flex: 1 }}>
                                                <div className="d-flex align-items-center">
                                                    <p style={{ margin: 0 }}>전화번호2:</p>
                                                    <div className="info-box">{selectedRow.buyerPhone2}</div>
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
                                            <div style={{ flex: 1 }}>
                                                <div className="d-flex align-items-center">
                                                    <p style={{ margin: 0 }}>전화번호1:</p>
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
                                                    <p style={{ margin: 0 }}>전화번호2:</p>
                                                    <div className="info-box">{selectedRow.recipientPhone2}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="d-flex justify-content-between mb-3">
                                            <div style={{ flex: 2 }}>
                                                <div className="d-flex align-items-center">
                                                    <p style={{ margin: 0 }}>주소:</p>
                                                    <div className="info-box">{selectedRow.address}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* ///////////////////////// page3: 주문서 상품정보 및 요구사항; selectedRow end //////////////////////////////////////////////////////////////////////////// */}

                                {/* ///////////////////////// page4: 고객 상담 내역 등록하기; new consultation start //////////////////////////////////////////////////////////////////////////// */}
                                <h4 className="custom-header-consultation">고객 상담 내역 등록하기</h4>
                                <CForm>
                                    <CRow className="mb-3">
                                        <CCol style={{ width: '12.5%' }}>
                                            <CFormLabel>상담구분</CFormLabel>
                                            <Select
                                                name="counselSection"
                                                options={counselSection}
                                                onChange={handleSelectChange_Consult}
                                                isSearchable
                                            />
                                        </CCol>
                                        <CCol style={{ width: '12.5%' }}>
                                            <CFormLabel>처리결과</CFormLabel>
                                            <Select
                                                name="counselResult"
                                                options={counselResult}
                                                onChange={handleSelectChange_Consult}
                                                isSearchable
                                            />
                                        </CCol>
                                        <CCol md={3}>
                                            <CFormLabel>상담시간</CFormLabel>
                                            <CFormInput type="text" value={newConsultations.consultationTime || ''} readOnly />
                                        </CCol>
                                        <CCol md={3}>
                                            <CFormLabel>완료시간</CFormLabel>
                                            <CFormInput type="text" value={newConsultations.completionTime || ''} placeholder='등록시 자동으로 기재됩니다' readOnly />
                                        </CCol>
                                        <CCol style={{ width: '20.83%' }}>
                                            <CFormLabel>상담원</CFormLabel>
                                            <CFormInput type="text" value={newConsultations.counseler || ''} readOnly />
                                        </CCol>
                                    </CRow>
                                    {/* ///////////////////////// page3: 고객 상담 내역 등록하기; new consultation start //////////////////////////////////////////////////////////////////////////// */}

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
                                {/* ///////////////////////// page4: 고객 상담 내역 등록하기; new consultation end //////////////////////////////////////////////////////////////////////////// */}
                                {/* ///////////////////////// page4: 기존 상담내역; prev consultation start //////////////////////////////////////////////////////////////////////////// */}
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
                                                <tr key={index} className={getRowClassConsultation(row.counselResult)}>
                                                    <td>
                                                        <CFormCheck
                                                            type="radio"
                                                            onChange={() => handleCheckboxChange_Consult(row)}
                                                            checked={selectedRow_Consult === row}
                                                        />
                                                    </td>
                                                    <td>{row.counselSection}</td>
                                                    <td>{row.counselResult}</td>
                                                    <td>{row.startDate}</td>
                                                    <td>{row.endDate}</td>
                                                    <td>{row.content}</td>
                                                    <td>{row.inputer}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/* ///////////////////////// page4: 기존 상담내역; prev consultation end //////////////////////////////////////////////////////////////////////////// */}

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
        </CRow >
    )
}

export default CustomerSupport
