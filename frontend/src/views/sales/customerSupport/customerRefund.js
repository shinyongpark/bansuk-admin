import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker'
import Select from 'react-select';
import axios from 'axios';
import CheckOrder from './parseCSV';
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

const CustomerRefund = () => {
    // page 1 & other option lists
    const [companies, setCompanies] = useState([])
    const [products, setProducts] = useState([]);
    const [listArray, setListArray] = useState([]);
    const [counselSection, setCounselSection] = useState([]);
    const [counselResult, setCounselResult] = useState([]); //value-label= [0-"미선택",1-"송장접수",2-"교환",3-"반품",4-"A/S",5-"------",6-"기타",7-"처리완료"]
    const [counselResultRefund, setCounselResultRefund] = useState([]);  //value-label= 4-A/S, 3-반품, 2-맞교환, 10-위3개모두, 7-처리완료, 0-4개모두
    const [counselResultRev, setCounselResultRev] = useState({});
    const [refundResult, setRefundResult] = useState([]);   //확인결과 = [상태확인]
    const [refundSection, setRefundSection] = useState([]); // 반품구분 = [undefined?]

    const [staffNames, setStaffNames] = useState([]);
    const [stockGood, setStockGood] = useState(null);
    const [loading, setLoading] = useState(false);
    const [countSearch, setCountSearch] = useState(null);

    // page 1 file upload - 첨부파일
    const [modalVisible, setModalVisible] = useState(false); //used for popup visibility
    const [selectedFile, setSelectedFile] = useState(null);
    const [errorMsg, setErrorMsg] = useState(''); // print error msg
    // page 1 test pass/fail
    const [isTestPassed, setIsTestPassed] = useState(false);
    const [orderData, setOrderData] = useState([]);
    const [stockData, setStockData] = useState([]);
    const [uploadedFileName, setUploadedFileName] = useState('');
    const [visibleTestCSV, setVisibleTestCSV] = useState(false);
    const [errorTestMsg, setErrorTestMsg] = useState([]); // print error msg


    // page 1 AS 현황
    const [visibleASTable, setVisibleASTable] = useState(false); //used for popup visibility
    const [selectedCounselerASTable, setSelectedCounselerASTable] = useState(""); //store when user picks the counseler/consultant
    const [consultationsAS, setConsultationsAS] = useState([]); // list of AS consultations
    const [consultationsASTable, setConsultationsASTable] = useState([]); // list of AS consultations shown in table
    const [selectedRowASTable, setSelectedRowASTable] = useState(null);
    const [selectedRowResASTable, setSelectedRowResASTable] = useState(null); // resolved AS consultation -> remove from the AS Table
    const [visibleASTableConfirmModal, setVisibleASTableConfirmModal] = useState(false); // Confirmation Modal visibility state

    // page 1 날짜별 상담내역 조회
    const [visibleConsultationsTable, setVisibleConsultationsTable] = useState(false); //used for popup visibility
    const [selectedRowConsultationsTable, setSelectedRowConsultationsTable] = useState(null);
    const [consultationsDateTable, setConsultationsDateTable] = useState([]); // list of AS consultations search by date


    // page2 show search result
    const [tableData, setTableData] = useState([]);
    const [tableDataBool, setTableDataBool] = useState(false);
    const [tableDataExternal, setTableDataExternal] = useState([]);
    const [tableDataCounsel, setTableDataConsel] = useState([]);
    const [selectedRow, setSelectedRow] = useState(); // saves the user selection on page2 for page3
    const [deliveryVisible, setDeliveryVisible] = useState(false); // used for delivery popup visibility
    const [deliveryUrl, setDeliveryUrl] = useState("");

    // page4 show search result for consultations (상담내역)
    const [consultations, setConsultations] = useState([]);
    const [newConsultations, setNewConsultations] = useState([]); // when user sends a new consultation
    const [selectedRowConsult, setSelectedRowConsult] = useState(null); // when user selects the consultation
    const [visibleConsultConfirmModal, setVisibleConsultConfirmModal] = useState(false); // Confirmation Modal visibility state




    //same fields as tableData; kept all fields for debugging
    const [productDetails, setProductDetails] = useState({
        company: '', //order_company
        productName: '', //상품명 goods_name
        counselSection: '',
        counselResult: '',
        counselResultRefund: '',
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
        return;
    }, []);

    // when user selects a row in page2, get all consultatoins(상담내역) for page4
    useEffect(() => {
        if (selectedRow) {
            const fetchConsultations = async () => {
                // same as customer support / sesarch consultations
                const response = await axios.post('/customer-support/search-consultations', selectedRow, {
                    headers: { 'Content-Type': 'application/json' },
                });
                const consultations = transformData_counsel(response.data);
                setConsultations(consultations);
            };

            fetchConsultations();
        }
        setSelectedRowConsult(null);
        return;
    }, [selectedRow]); // Dependency on selectedRow


    // helper functions ///////////////////////////////////////////////////////////////////////////////////

    // convert time(utc timezone or kr timezone) to kr time
    const getKrDate = (time = null) => {
        if (time) {
            return (new Date(time)).toLocaleString("en-US", { timeZone: "Asia/Seoul" })
        }
        // convert current time to kr
        return (new Date()).toLocaleString("en-US", { timeZone: "Asia/Seoul" })

    }

    // get all options for SELECT lists
    const fetchSelectList = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/get-select-list');
            const parsedCounselResult = response.data.counsel_result.map((item, index) => ({
                value: item === "" ? "" : String(index),
                label: item === "" ? "미선택" : item
            }))
            setCounselResult(parsedCounselResult);

            const parsedCounselResultRev = parsedCounselResult.reduce((acc, curr) => {
                acc[curr.label] = curr.value;
                return acc;
            }, {});
            setCounselResultRev(parsedCounselResultRev);

            const parsedCounselResultRefund = response.data.counsel_result_refund.map((item, index) => {
                if (parsedCounselResultRev[item]) {
                    return {
                        value: parsedCounselResultRev[item],
                        label: item
                    };
                } else {
                    return {
                        value: item === "위 3개모두" ? "10" : "0",
                        label: item
                    };
                }
            });
            setCounselResultRefund(parsedCounselResultRefund);

            // 값이 1개만 존재; 반품관리 페이지 참조
            setRefundResult([{ label: "상태확인", value: "0" }])
            setRefundSection([{ label: "undefined", value: "0" }])

            const parsedStaffNames = response.data.staff_name.map(item => ({
                value: item === "모두" ? "" : item,
                label: item
            }))
            setStaffNames(parsedStaffNames);

            setListArray(response.data)
            setLoading(false);
            return;
        } catch (error) {
            console.error('Error fetching categories:', error);
            setLoading(false);
            return;
        }
    };

    // change counsel data fields from DB to web
    const transformData_counsel = (data) => {
        const counselResult_m = ["상태 확인", "완료"];
        return data.map(item => ({
            uid: item.uid,  // Corresponding field from DB
            group_uid: item.group_uid || '',
            external_uid: item.external_uid,
            startDate: item.reg_date ? getKrDate(item.reg_date) : "",  // Format date
            endDate: item.end_date ? getKrDate(item.end_date) : "",  // Format date
            counselSection: item.table === "c" ? listArray.counsel_section[Number(item.counsel_section)] : counselResult_m[Number(item.proceed)],  // Assuming this corresponds to category
            counseler: item.table === "c" ? item.counseler : item.manager, // m.manager or c.counseler
            counselResult: listArray.counsel_result[Number(item.counsel_result)],
            content: item.counsel_content,
            buyerName: item.buyer_name || '',
            dept: item.table === "c" ? "영업부" : "관리부",
        }));
    };

    // change stockGood data fields from DB to web
    const transformData_stock = (data) => {
        return data.map(item => ({
            goodAlias: item.good_alias,
            goodName: item.good_name,
            good_id: item.good_id,
            goodExist: item.good_exist,
            cateId: item.cate_id
        }));
    }

    // change external buyer data fields from DB to web
    const transformData_external = (data) => data.map(item => ({
        company: item.order_company || '',
        group_uid: item.group_uid || '',
        uid: item.uid,
        counsel_uid: item.counsel_uid || '',
        productName: item.goods_name || '',
        counselSection: item.counsel_section || '',
        counselResult: listArray.counsel_result[Number(item.counsel_result)] || '',
        startDate: item.reg_date ? getKrDate(new Date(item.reg_date).toISOString().replace('Z', '+09:00')) : '',  // time is stored as kr time with utc timezone(Z)
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
        request: item.comments || ''
    }));

    // change manager table data fields from DB to web
    const transformData_manager = (data) => data.map(item => ({
        uid: item.uid,
        group_uid: item.group_uid,
        external_uid: item.external_uid,
        startDate: item.reg_date ? getKrDate(item.reg_date) : "",  // Format date
        recipient: item.name,
        productName: item.good_name,
        counselResult: listArray.counsel_result[Number(item.counsel_result)],
        counseler: item.counseler,
        content: item.counsel_content,
        manager: item.manager
    }));

    // admin_counsel_print1.php > '운송장 번호로 택배회사로 연결시키기' 파트 참고
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
                deliveryUrl = `http://ptop.sedex.co.kr:443443/jsp/tr/detailSheet.jsp?iSheetNo=${invoiceNo}`;
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

    // Page1, 2: 검색, 검색결과 ///////////////////////////////////////////////////////////////////////////////////
    // used for text inputs
    const handleChange = (e) => {
        setProductDetails(prevDetails => ({
            ...prevDetails,
            [e.target.name]: e.target.value || '',
        }));
        return;
    };
    // used for Select inputs
    const handleSelectChange = (selectedOption, { name }) => {
        setProductDetails({
            ...productDetails,
            [name]: selectedOption,
        });
        return;
    };
    // when user selects a row, affects page2, 3
    const handleCheckboxChange = async (row) => {
        setNewConsultations(prevState => ({
            consultationTime: getKrDate(),
            counseler: sessionStorage.getItem('name')
        }));
        if (tableDataBool) {
            const matchingIteEx = tableDataExternal.find(item => item.group_uid === row.group_uid);
            if (!matchingIteEx) {
                console.log("row.group_uid not found in external_buyer_table: ", row.group_uid)
                alert("데이터 조회 중 문제가 발생했습니다. 관리자에게 문의해주세요");
                return;
            }
            setSelectedRow(selectedRow === matchingIteEx ? null : matchingIteEx)
        } else {
            setSelectedRow(selectedRow === row ? null : row)
        }
        return;
    };

    // when user hits 조회
    const handleView = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (productDetails.counselResultRefund === '') {
                alert("상담구분의 처리결과 값을 설정해주세요");
                setLoading(false); // Hide loading spinner
                return;
            }
            const response = await axios.post('/customer-support-refund/search', productDetails, {
                headers: { 'Content-Type': 'application/json' },
            });
            var transformedData;
            if (response.data.counsel_table) {
                transformedData = transformData_counsel(response.data.ordered_item)
                const transformedData_ex = transformData_external(response.data.ordered_item_ex)
                setTableDataExternal(transformedData_ex); // for this case only
            } else {
                transformedData = transformData_external(response.data.ordered_item)
                const transformedData_c = transformData_counsel(response.data.ordered_item_c)
                setTableDataCounsel(transformedData_c); // for this case only
            }
            // Update the state with the transformed data
            setTableDataBool(response.data.counsel_table);
            setTableData(transformedData);
            setCountSearch(transformedData.length);
            setSelectedRow(null);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                alert('검색 데이터가 너무 많아 시간이 오래 걸립니다. 발송기간을 설정해주세요');
            } else {
                console.error('Error fetching data:', error);
                alert('데이터 조회 중 문제가 발생했습니다. 관리자에게 문의해주세요')
            }
        } finally {
            setLoading(false); // Hide loading spinner
            return;
        }

    };


    // Page2: 배송 조회: delivery popup /////////////////////////////////////////////////////////////////////////////
    const handleInvoiceClick = (invoiceNo, regDate) => {
        const url = getDeliveryUrl(invoiceNo, regDate);
        setDeliveryUrl(url);
        setDeliveryVisible(true);
        return;
    };

    const closeModal = () => {
        setDeliveryVisible(false);
        setDeliveryUrl(""); // Clear the URL when closing the modal
        return;
    };

    // Page4: 고객 상담 내역: Consultation Table ///////////////////////////////////////////////////////////////////////
    const handleChange_Consult = (e) => {
        setNewConsultations({
            ...newConsultations,
            [e.target.name]: e.target.value,
        });
        return;
    };
    const handleSelectChange_Consult = (selectedOption, { name }) => {
        setNewConsultations({
            ...newConsultations,
            [name]: selectedOption,
        });
        return;
    };
    const handleCheckboxChange_Consult = (row) => {
        setSelectedRowConsult(row);
        setNewConsultations({
            consultationTime: getKrDate(),
            counseler: sessionStorage.getItem('name'),
            content: row.content
        });
        return;
    };

    const handleNewConsultation = () => {
        setSelectedRowConsult(null);
        setNewConsultations({
            consultationTime: getKrDate(),
            counseler: sessionStorage.getItem('name')
        });
        return;
    }

    // when user submits new consultation 
    const handleConsulation = async () => {
        alert('미완성입니다. 다른부분 검토해주세요')
        return;
        if (!newConsultations.content || !newConsultations.counselResult || !newConsultations.counselSection) {
            alert("모두 작성해주세요");
            return;
        }

        // if (tableDataBool) {
        //     const counselData = {}
        //     newConsultations = {
        //         ...newConsultations,
        //         completionTime: getKrDate(),
        //         group_uid: selectedRow.group_uid,
        //         external_uid: selectedRow.uid,
        //         counsel_uid: selectedRow.uid,
        //         name: selectedRow.name,
        //         purchase_name: selectedRow.purchaser_name,
        //         goods_name: selectedRow.goods_name,
        //         purchase_date: selectedRow.reg_date,

        //     }
        // }
        try {
            const response = await axios.post('/customer-support-refund/submit-consultations', newConsultations, {
                headers: { 'Content-Type': 'application/json' },
                withCredentials: true
            });
            //update consultations in page 4
            const response_search = await axios.post('/customer-support/search-consultations', selectedRow, {
                headers: { 'Content-Type': 'application/json' },
            });
            const consultations_new = transformData_counsel(response_search.data);
            setSelectedRowConsult(null);
            setNewConsultations({
                consultationTime: getKrDate(),
                counseler: sessionStorage.getItem('name')
            });
            setConsultations(consultations_new);
            return;
        } catch (error) {
            console.error('Error fetching data:', error);
            return;
        }
    };

    // when user edits consultation 
    const handleSelectedRowConsult = async (selectedRowConsult) => {
        alert('미완성입니다. 다른부분 검토해주세요')
        return;
        if (!newConsultations.content) {
            alert("상담 내용을 작성해주세요");
            return;
        }
        try {
            setLoading(true);
            newConsultations["uid"] = selectedRowConsult.uid
            newConsultations["completionTime"] = getKrDate()
            newConsultations["external_uid"] = selectedRowConsult.external_uid;
            const response = await axios.post('/customer-support/edit-consultations', newConsultations, {
                headers: { 'Content-Type': 'application/json' },
                withCredentials: true
            });
            //update consultations in page 4
            const response_search = await axios.post('/customer-support/search-consultations', selectedRow, {
                headers: { 'Content-Type': 'application/json' },
            });
            const consultations_new = transformData_counsel(response_search.data);
            setSelectedRowConsult(null)
            setNewConsultations({
                consultationTime: getKrDate(),
                counseler: sessionStorage.getItem('name')
            });
            setConsultations(consultations_new);
            setLoading(false);
            return;
        } catch (error) {
            setLoading(false);
            alert("수정이 불가능합니다", error)
            console.error('Error fetching data:', error);
            return;
        }
    }

    // when user deletes consultation ask for confirmation
    const handleConsultConfirm = async () => {
        alert('미완성입니다. 다른부분 검토해주세요')
        return;
        selectedRowConsult.counselResult = counselResultRev[selectedRowConsult.counselResult];
        setLoading(true);
        try {
            const response = await axios.post('/customer-support/delete-consultations', selectedRowConsult, {
                headers: { 'Content-Type': 'application/json' },
                withCredentials: true
            });
        } catch (error) {
            console.error('Error deleting data:', error);
            setLoading(false);
            setVisibleConsultConfirmModal(false);
            return;
        }

        // reload consultation Table in page4
        try {
            const response_search = await axios.post('/customer-support/search-consultations', selectedRow, {
                headers: { 'Content-Type': 'application/json' },
            });
            const consultations_new = transformData_counsel(response_search.data);
            setSelectedRowConsult(null)
            setNewConsultations({
                consultationTime: getKrDate(),
                counseler: sessionStorage.getItem('name')
            });
            setConsultations(consultations_new);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
            setVisibleConsultConfirmModal(false);
            return;
        }

    };

    const handleConsultCancel = () => {
        setVisibleConsultConfirmModal(false);
        return;
    };

    // change color coding for page 4 based on counsel_result
    // if want to change color or add new go to frontend/src/scss/_custom.scss
    const getRowClassConsultation = (result) => {
        switch (result) {
            case '':
                return 'in-progress-row';
            case '송장접수':
                return 'in-progress-row';
            case '교환':
                return 'failure-row';
            case '반품':
                return 'failure-row';
            case 'A/S':
                return 'in-progress-row';
            case '------':
                return 'in-progress-row';
            case '기타':
                return 'in-progress-row';
            case '처리완료':
                return 'other';
            default:
                return 'return-row'; //unknown type??
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
                        <CModal visible={loading} backdrop="static" keyboard={false} size="sm">
                            <CModalBody style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <CSpinner color="primary" /> <span style={{ marginLeft: '10px' }}>Loading...</span>
                            </CModalBody>
                        </CModal>

                        <CForm className="row g-3" style={{ marginBottom: '1rem' }}>
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
                                            autoComplete='unique-startDate'
                                        />
                                    </div>
                                    <div style={{ flex: 2.5 }}>
                                        <DatePicker
                                            selected={productDetails.endDate}
                                            onChange={date => setProductDetails({ ...productDetails, endDate: date })}
                                            dateFormat="yyyy-MM-dd"
                                            placeholderText="종료: YYYY-MM-DD"
                                            autoComplete='unique-endDate'
                                        />
                                    </div>
                                </div>
                            </CCol>

                            {/* 상담구분 */}
                            <CCol md={4}>
                                <CFormLabel>상담구분</CFormLabel>
                                <div className="d-flex align-items-center">
                                    <div style={{ flex: 2 }}>
                                        <Select
                                            name="counselResultRefund"
                                            options={counselResultRefund}
                                            onChange={handleSelectChange}
                                            placeholder="처리결과"
                                            isSearchable
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
                            {/* 조회 버튼 */}
                            <CCol md={2}>
                                <CFormLabel>총 {countSearch ? countSearch : 0}건</CFormLabel>
                                <div style={{ flex: 2 }}>
                                    <CButton color="primary" type="submit" onClick={handleView}>조회</CButton>
                                </div>
                            </CCol>
                        </CForm>
                        {/* ///////////////////////// page1: 주문 검색 end //////////////////////////////////////////////////////////////////////////// */}


                        {/* ///////////////////////// page2: 결과 화면; tableData start //////////////////////////////////////////////////////////////////////////// */}

                        {tableDataBool && (<div style={{ height: '300px', overflowY: 'scroll' }}>
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '3%' }}> </th>
                                        <th style={{ width: '10%' }}>상담구분</th>
                                        <th style={{ width: '10%' }}>처리결과</th>
                                        <th style={{ width: '7%' }}>수취인</th>
                                        <th style={{ width: '10%' }}>최초상담일자</th>
                                        <th style={{ width: '10%' }}>상담시간</th>
                                        <th style={{ width: '12%' }}>완료날짜</th>
                                        <th style={{ width: '10%' }}>상담내용</th>
                                        <th style={{ width: '20%' }}>상담원</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableData.map((row, index) => (
                                        <tr
                                            key={index}
                                            className={getRowClassConsultation(row.counselResult)}
                                        >
                                            <td>
                                                <CFormCheck
                                                    type="radio"
                                                    onChange={() => handleCheckboxChange(row)}
                                                    //selectedRow is from external_buyer_table and row is from consult_table
                                                    //must use group_uid (not uid) to check
                                                    checked={selectedRow?.group_uid === row.group_uid}
                                                />
                                            </td>
                                            <td>{row.counselSection}</td>
                                            <td>{row.counselResult}</td>
                                            <td>{row.recipientName}</td>
                                            <td>{row.startDate}</td>
                                            <td>{row.endDate}</td>
                                            <td>{row.endDate}</td>
                                            <td>{row.content}</td>
                                            <td>{row.counseler}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>)}
                        {/* ///////////////////////// page2: 결과 화면 상담; tableData end //////////////////////////////////////////////////////////////////////////// */}

                        {/* ///////////////////////// page2: 결과 화면; tableData start 상담 내역이 완료되었거나 없을때 쿼리. //////////////////////////////////////////////////////////////////////////// */}
                        {!tableDataBool && (
                            <div style={{ height: '350px', overflowY: 'scroll' }}>
                                <div className="d-flex justify-content-center mb-3">
                                    <h4 className="custom-header-refund">영업부에서 입력된 내용이 없어 주문서 검색을 합니다</h4>
                                </div>
                                <table className="custom-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '3%' }}> </th>
                                            <th style={{ width: '10%' }}>업체</th>
                                            <th style={{ width: '10%' }}>발송일자</th>
                                            <th style={{ width: '7%' }}>구매인</th>
                                            <th style={{ width: '7%' }}>수취인</th>
                                            <th style={{ width: '10%' }}>전화번호1</th>
                                            <th style={{ width: '10%' }}>전화번호2</th>
                                            <th style={{ width: '12%' }}>상품명</th>
                                            <th style={{ width: '10%' }}>송장번호</th>
                                            <th style={{ width: '20%' }}>요구사항</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tableData.map((row, index) => (
                                            <tr
                                                key={index}
                                                className={getRowClassConsultation(row.counselResult)}
                                            >
                                                <td>
                                                    <CFormCheck
                                                        type="radio"
                                                        onChange={() => handleCheckboxChange(row)}
                                                        checked={selectedRow?.uid === row.uid}
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
                                        <CModalTitle>배송 조회</CModalTitle>
                                    </CModalHeader>
                                    <CModalBody>
                                        {deliveryUrl ? (
                                            <iframe
                                                src={deliveryUrl}
                                                style={{ width: '100%', height: '500px', border: 'none' }}
                                                title="Delivery Tracking"
                                            ></iframe>
                                        ) : (
                                            <p>배송 정보 조회가 안됩니다. 송장번호 혹은 URL을 확인해주세요.</p>
                                        )}
                                    </CModalBody>
                                    <CButton color="secondary" onClick={closeModal}>Close</CButton>
                                </CModal>
                                {/* ///////////////////////// page2: delivery popup end //////////////////////////////////////////////////////////////////////////// */}

                            </div>)}
                        {/* ///////////////////////// page2: 결과 화면 상담 내역이 완료되었거나 없을때 쿼리; tableData end //////////////////////////////////////////////////////////////////////////// */}
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
                                </div>

                                <div className="d-flex justify-content-between mb-3">
                                    <div style={{ flex: 1 }}>
                                        <div className="d-flex align-items-center">
                                            <p style={{ margin: 0 }}>상품명:</p>
                                            <div className="info-box">{selectedRow.productName}</div>
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
                                {!selectedRowConsult && (
                                    <>
                                        <h4 className="custom-header-consultation">제품 입고 내용 입력</h4>
                                        <CForm>
                                            <CRow className="mb-3">
                                                <CCol style={{ width: '12.5%' }}>
                                                    <CFormLabel>반품구분</CFormLabel>
                                                    <Select
                                                        name="refundSection"
                                                        options={refundSection}
                                                        onChange={handleSelectChange_Consult}
                                                        placeholder={newConsultations.refundSection}
                                                        // value={newConsultations.refundSection || ""} 
                                                        value={refundSection[0]} //only one value available
                                                        isSearchable
                                                    />
                                                </CCol>
                                                <CCol style={{ width: '12.5%' }}>
                                                    <CFormLabel>확인결과</CFormLabel>
                                                    <Select
                                                        name="refundResult"
                                                        options={refundResult}
                                                        onChange={handleSelectChange_Consult}
                                                        placeholder={newConsultations.refundResult}
                                                        // value={newConsultations.refundResult || ""}
                                                        value={refundResult[0]} //only one value available
                                                        isSearchable
                                                    />
                                                </CCol>
                                                <CCol md={3}>
                                                    <CFormLabel>확인시간</CFormLabel>
                                                    <CFormInput type="text" value={newConsultations.consultationTime || ''} readOnly />
                                                </CCol>
                                                <CCol md={1}>
                                                    <CFormLabel>완료시간</CFormLabel>
                                                    <CFormInput type="text" value={newConsultations.completionTime || ''} placeholder='자동' readOnly />
                                                </CCol>
                                                <CCol md={2}>
                                                    <CFormLabel>반품분류</CFormLabel>
                                                    <CFormInput type="text" name='outgoing_num' value={newConsultations.outgoing_num || ''} placeholder='입고요망 개수' onChange={handleChange_Consult} />
                                                </CCol>
                                                <CCol style={{ width: '20.83%' }}>
                                                    <CFormLabel>상담원</CFormLabel>
                                                    <CFormInput type="text" value={newConsultations.counseler || ''} readOnly />
                                                </CCol>
                                            </CRow>
                                            <CRow className="mb-3">
                                                <CCol md={12}>
                                                    <CFormLabel>상담내용</CFormLabel>
                                                    <textarea
                                                        name="content"
                                                        placeholder="상담 내용을 입력하세요"
                                                        value={newConsultations.content || ''}
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
                                                    <CButton color="primary" onClick={handleConsulation}>등록하기</CButton>
                                                </CCol>
                                            </CRow>
                                        </CForm>
                                    </>
                                )}
                                {/* ///////////////////////// page3: 고객 상담 내역 등록하기; new consultation end //////////////////////////////////////////////////////////////////////////// */}
                                {/* ///////////////////////// page3: 고객 상담 내역 등록하기; edit consultation start //////////////////////////////////////////////////////////////////////////// */}
                                {selectedRowConsult && (
                                    <>
                                        <h4 className="custom-header-consultation">고객 상담 내역 등록하기</h4>
                                        <CForm>
                                            <CRow className="mb-3">

                                                {/* <CCol style={{ width: '12.5%' }}>
                                                    <CFormLabel>처리결과</CFormLabel>
                                                    <CFormInput type="text" name="counselResult" value={selectedRowConsult.counselResult || ''} readOnly />
                                                </CCol> */}
                                                <CCol style={{ width: '12.5%' }}>
                                                    <CFormLabel>반품구분</CFormLabel>
                                                    <Select
                                                        name="refundSection"
                                                        options={refundSection}
                                                        onChange={handleSelectChange_Consult}
                                                        placeholder={selectedRowConsult.refundSection}
                                                        // value={newConsultations.refundSection || ""} 
                                                        value={refundSection[0]} //only one value available
                                                        isSearchable
                                                    />
                                                </CCol>
                                                <CCol style={{ width: '12.5%' }}>
                                                    <CFormLabel>확인결과</CFormLabel>
                                                    <Select
                                                        name="refundResult"
                                                        options={refundResult}
                                                        onChange={handleSelectChange_Consult}
                                                        placeholder={selectedRowConsult.refundResult}
                                                        // value={newConsultations.refundResult || ""}
                                                        value={refundResult[0]} //only one value available
                                                        isSearchable
                                                    />
                                                </CCol>
                                                <CCol md={3}>
                                                    <CFormLabel>상담시간</CFormLabel>
                                                    <CFormInput type="text" name="startDate" value={selectedRowConsult.startDate || ''} readOnly />
                                                </CCol>
                                                <CCol md={1}>
                                                    <CFormLabel>완료시간</CFormLabel>
                                                    <CFormInput type="text" value={newConsultations.completionTime || ''} placeholder='자동' readOnly />
                                                </CCol>
                                                <CCol md={2}>
                                                    <CFormLabel>반품분류</CFormLabel>
                                                    <CFormInput type="text" name='outgoing_num' value={selectedRowConsult.outgoing_num || ''} placeholder='입고요망 개수' onChange={handleChange_Consult} />
                                                </CCol>
                                                <CCol style={{ width: '20.83%' }}>
                                                    <CFormLabel>상담원</CFormLabel>
                                                    <CFormInput type="text" name="counseler" value={selectedRowConsult.counseler || ''} readOnly />
                                                </CCol>
                                            </CRow>
                                            <CRow className="mb-3">
                                                <CCol md={12}>
                                                    <CFormLabel>상담내용</CFormLabel>
                                                    <textarea
                                                        name="content"
                                                        placeholder={selectedRowConsult.content || "상담 내용을 입력하세요"}
                                                        onChange={handleChange_Consult}
                                                        value={newConsultations.content || ""}
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
                                                    <CButton color="primary" onClick={async () => { handleSelectedRowConsult(selectedRowConsult) }} style={{ marginRight: '5px' }}>등록하기</CButton>
                                                    <CButton color="primary" onClick={async () => { setVisibleConsultConfirmModal(true) }} style={{ marginRight: '5px' }}>삭제하기</CButton>
                                                    <CButton color="primary" onClick={handleNewConsultation}>새로 작성하기</CButton>
                                                </CCol>
                                            </CRow>
                                        </CForm>
                                        {/* ///////////////////////// page4: 고객 상담 내역 삭제하기 확인 팝업; delete consultation popup //////////////////////////////////////////////////////////////////////////// */}
                                        <CModal visible={visibleConsultConfirmModal} onClose={() => setVisibleConsultConfirmModal(false)} size="sm">
                                            <CModalHeader onClose={() => setVisibleConsultConfirmModal(false)}>
                                                <CModalTitle>확인</CModalTitle>
                                            </CModalHeader>
                                            <CModalBody>선택하신 상담내역을 삭제하시겠습니까?</CModalBody>
                                            <CModalFooter>
                                                <CButton color="primary" onClick={handleConsultConfirm}>네</CButton>
                                                <CButton color="secondary" onClick={handleConsultCancel}>아니요</CButton>
                                            </CModalFooter>
                                        </CModal>
                                    </>
                                )}

                                {/* ///////////////////////// page4: 고객 상담 내역 등록하기; edit consultation end //////////////////////////////////////////////////////////////////////////// */}
                                {/* ///////////////////////// page4: 기존 상담내역; prev consultation start //////////////////////////////////////////////////////////////////////////// */}
                                <h4 className="custom-header-consultation">기존 상담내역 (상담시간 기준 오름차순)</h4>
                                <div style={{ height: '200px', overflowY: 'scroll' }}>
                                    <table className="custom-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '3%' }}> </th>
                                                <th style={{ width: '8%' }}>부서</th>
                                                <th style={{ width: '8%' }}>상담구분<br />(처리상태)</th>
                                                <th style={{ width: '10%' }}>상담시간</th>
                                                <th style={{ width: '10%' }}>완료시간</th>
                                                <th style={{ width: '45%' }}>상담내용</th>
                                                <th style={{ width: '7%' }}>상담원</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {consultations.map((row, index) => (
                                                <tr key={index} className={getRowClassConsultation(row.counselResult)}>
                                                    <td>
                                                        <CFormCheck
                                                            type="radio"
                                                            onChange={() => handleCheckboxChange_Consult(row)}
                                                            checked={selectedRowConsult === row}
                                                        />
                                                    </td>
                                                    <td>{row.dept}</td>
                                                    <td>{row.counselSection}<br />({row.counselResult})</td>
                                                    <td>{row.startDate}</td>
                                                    <td>{row.endDate}</td>
                                                    <td>{row.content}</td>
                                                    <td>{row.counseler}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/* ///////////////////////// page4: 기존 상담내역; prev consultation end //////////////////////////////////////////////////////////////////////////// */}
                            </div>
                        )}
                    </CCardBody>
                </CCard>
            </CCol>
        </CRow >
    )
}

export default CustomerRefund
