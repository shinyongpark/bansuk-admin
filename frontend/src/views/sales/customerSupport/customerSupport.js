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

const CustomerSupport = () => {
    // page 1 & other option lists
    const [companies, setCompanies] = useState([])
    const [products, setProducts] = useState([]);
    const [listArray, setListArray] = useState([]);
    const [counselSection, setCounselSection] = useState([]);
    const [counselResult, setCounselResult] = useState([]);
    const [counselResultRev, setCounselResultRev] = useState({});
    const [staffNames, setStaffNames] = useState([]);
    const [stockGood, setStockGood] = useState(null);
    const [loading, setLoading] = useState(false);

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
    const [selectedRow, setSelectedRow] = useState(null); // saves the user selection on page2 for page3
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

    // Convert Data to CSV
    const convertToCSV = (data) => {
        const array = [Object.keys(data[0])].concat(data);
        return array.map(it => {
            return Object.values(it).toString();
        }).join("\n");
    }

    // Download the converted CSV file
    const downloadCSV = () => {
        if (!tableData || !tableData.length) {
            alert("No data available to download.");
            return;
        }
        const csvData = convertToCSV(tableData);
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'downloaded_data.csv'); // Specify the file name
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }    

    // get the lists when open page
    useEffect(() => {
        fetchSelectList();
        return;
    }, []);

    // when user selects a row in page2, get all consultatoins(상담내역) for page4
    useEffect(() => {
        if (selectedRow) {
            const fetchConsultations = async () => {
                const response = await axios.post('/customer-support/search-consultations', selectedRow, {
                    headers: { 'Content-Type': 'application/json' },
                });
                const consultations = transformData_counsel(response);

                // check if one of them is result==7(처리완료) if so reassign all 상태 to 처리 완료
                // this will NOT change the info in DB 
                const checkedConsultations = checkCounselResults(consultations);
                setConsultations(checkedConsultations);
            };

            fetchConsultations();
        }
        setSelectedRowConsult(null);
        return;
    }, [selectedRow]); // Dependency on selectedRow


    // helper functions ///////////////////////////////////////////////////////////////////////////////////
    const getKrDate = () => {
        const utc = Date.now()
        const kr_time_diff = 9 * 60 * 60 * 1000;
        const kr_curr = new Date(utc + kr_time_diff);
        return kr_curr
    }

    // get all options for SELECT lists
    const fetchSelectList = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/get-select-list');
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

            const parsedCounselResultRev = parsedCounselResult.reduce((acc, curr) => {
                acc[curr.label] = curr.value;
                return acc;
            }, {});
            setCounselResultRev(parsedCounselResultRev);

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
            setLoading(false);
            return;
        } catch (error) {
            console.error('Error fetching categories:', error);
            setLoading(false);
            return;
        }
    };

    // change counsel data fields from DB to web
    const transformData_counsel = (response) => {
        const counselResult_m = ["상태 확인", "완료"];
        return response.data.map(item => ({
            id: item.uid,  // Corresponding field from DB
            group_uid: item.group_uid || '',
            external_uid: item.external_uid,
            startDate: item.reg_date.split('T')[0],  // Format date
            endDate: item.end_date.split('T')[0],  // Format date
            counselSection: item.table === "c" ? listArray.counsel_section[Number(item.counsel_section)] : counselResult_m[Number(item.proceed)],  // Assuming this corresponds to category
            counseler: item.table === "c" ? item.counseler : item.manager, // m.manager or c.counseler
            counselResult: listArray.counsel_result[Number(item.counsel_result)],
            content: item.counsel_content,
            buyerName: item.buyer_name || '',
        }));
    };

    // change stockGood data fields from DB to web
    const transformData_stock = (response) => {
        return response.data.map(item => ({
            goodAlias: item.good_alias,
            goodName: item.good_name,
            good_id: item.good_id,
            goodExist: item.good_exist,
            cateId: item.cate_id
        }));
    }

    //check if consultation is resolved
    function checkCounselResults(consultations) {
        const hasProcessed = consultations.some(item => item.counselResult === "처리완료");

        if (hasProcessed) {
            consultations.forEach(item => {
                item.counselResult = "처리완료";
            });
        }
        return consultations;
    }

    // change external buyer data fields from DB to web
    const transformData_external = (response) => response.data.map(item => ({
        company: item.order_company || '',
        group_uid: item.group_uid || '',
        uid: item.uid,
        productName: item.goods_name || '',
        counselSection: item.counsel_section || '',
        counselResult: listArray.counsel_result[Number(item.counsel_result)] || '',
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
        request: item.comments || ''
    }));

    // change manager table data fields from DB to web
    const transformData_manager = (response) => response.data.map(item => ({
        id: item.uid,
        group_uid: item.group_uid,
        external_uid: item.external_uid,
        startDate: item.reg_date.split('T')[0],  // Format date
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

    // Page 1 : AS 현황 조회: ASTable //////////////////////////////////////////////////////////////////////////////////////////

    const handleCounselerFilterChange = (selectedOption, { name }) => {
        setSelectedCounselerASTable({
            [name]: selectedOption,
        });
        return;
    };

    //when user selects the counseler it filters the consultationsAS
    useEffect(() => {
        if (selectedCounselerASTable) {
            const filteredConsultations = consultationsAS.filter(
                (row) => (selectedCounselerASTable.ASCounseler.value === '' || row.counseler === selectedCounselerASTable.ASCounseler.value)
            );

            setConsultationsASTable(filteredConsultations);
        }
        return;
    }, [selectedCounselerASTable]);

    // when the user hits "AS 현황 조회", shows pop up
    const handleASView = async (e) => {
        e.preventDefault();
        setVisibleASTable(!visibleASTable);
        try {
            //get all AS data; when user changes the staffNames list then fliter
            const response = await axios.get('/customer-support/search-ASTable');
            const consultations = transformData_manager(response);

            // Update the state with the transformed data
            setConsultationsASTable(consultations)
            return setConsultationsAS(consultations);
        } catch (error) {
            console.error('Error fetching data:', error);
            return;
        }
    };

    // when user selects the row, shows on page 2
    const handleCheckboxChangeASTable = async (row) => {
        setSelectedRowASTable(row);
        const foundSelected = tableData.filter((row_table) => row_table.group_uid === row.group_uid)[0]
        if (foundSelected) {
            setSelectedRow(foundSelected);
        } else {
            const response = await axios.post('/customer-support/search-ASTable/consultations', row, {
                headers: { 'Content-Type': 'application/json' },
            });
            const transformedData = transformData_external(response);

            // show it to Page2; user will select there
            setTableData(transformedData);
            setSelectedRow(null); // reset the selectedrow to reset the page3 page
        }
        return;
    };

    const handleASTableConfirm = async () => {
        // set proceed = 1: resolved = 반품 완료
        try {
            const response = await axios.post('/customer-support/search-ASTable/resolved', selectedRowResASTable, {
                headers: { 'Content-Type': 'application/json' },
                withCredentials: true
            });
        } catch (error) {
            console.error('Error updating data:', error);
            return;
        }

        // reload AS Table
        try {
            //get all AS data; when user changes the staffNames list then fliter
            const response = await axios.get('/customer-support/search-ASTable');
            const consultations = transformData_manager(response);

            // Update the state with the transformed data
            setConsultationsASTable(consultations);
            setVisibleASTableConfirmModal(false);
            return setConsultationsAS(consultations);
        } catch (error) {
            console.error('Error fetching data:', error);
            return;
        }

    };

    const handleASTableCancel = () => {
        setVisibleASTableConfirmModal(false);
        return;
    };

    // Page 1 : 상담내역: consultationTable ////////////////////////////////////////////////////////////////////////////
    // when the user hits "상담내역 조회", shows pop up
    const handleConsultationsView = async (e) => {
        e.preventDefault();
        setVisibleConsultationsTable(!visibleConsultationsTable);
        try {
            //get all consultation data
            const response = await axios.post('/customer-support/search-ConsultationsTable', productDetails, {
                headers: { 'Content-Type': 'application/json' }
            });

            const consultations = transformData_counsel(response);

            // Update the state with the transformed data
            setConsultationsDateTable(consultations)
            return;
        } catch (error) {
            console.error('Error fetching data:', error);
            return;
        }
    };


    // when user selects the row, shows on page 2
    const handleCheckboxChangeConsultationsTable = async (row) => {
        setSelectedRowConsultationsTable(row);

        const foundSelected = tableData.filter((row_table) => row_table.group_uid === row.group_uid)[0]
        if (foundSelected) {
            setSelectedRow(foundSelected);
        } else {
            const response = await axios.post('/customer-support/search-ASTable/consultations', row, {
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
        setErrorMsg(''); // Reset error message
        return;
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check if the file is a CSV
            if (file.type !== 'text/csv') {
                setErrorMsg('Please upload a valid CSV file.');
                setSelectedFile(null); // Reset file input
            } else {
                setErrorMsg('');
                setSelectedFile(file);
            }
        }
        return;
    };

    const handleUpload = () => {
        if (selectedFile) {
            setUploadedFileName(selectedFile.name)
            setModalVisible(false);
            setIsTestPassed(false); //reset after uploading
            return;
        }
    };

    // Page1: 주문서 저장 및 재고 파악: test //////////////////////////////////////////////////////////////////////////////////
    // do all checking 1. get_data_from_file() / check_date() / check_good_name_rule() / grouping_goods() /  2. check_data()
    const handleOrderCheck = async () => {
        try {
            setLoading(true);
            setIsTestPassed(false); //reset when checking
            if (!productDetails.orderCount || !Number(productDetails.orderCount) || productDetails.orderCount === 0) {
                alert("총 주문수를 확인해주세요");
            } else if (!selectedFile) {
                alert("첨부 파일을 선택해주세요");
            } else {
                let parsedStockGood = stockGood
                if (!parsedStockGood) { //call only once if needed
                    const getstockGood = await axios.get('/get-stock-good');
                    parsedStockGood = transformData_stock(getstockGood)
                    setStockGood(parsedStockGood);
                }

                //get orderid
                const getstockGood = await axios.get('/get-next-orderid');
                const order_uid = getstockGood.data;
                // 데이터 포멧 체크 + 비활성화 제품이 있으면 에러 발생: check_data() 두번째 파트
                const checking = new CheckOrder(selectedFile, productDetails.orderCount, order_uid, listArray.order_company, parsedStockGood)
                const response = await checking.getDataFromFile();
                if (!response[0]) {
                    throw new Error(response[1]);
                }
                // Check date against external_buyer_table: check_data() 첫번째 파트
                // 제품을 확인하지 않고 날짜만 확인하는건가요..?
                // create set of start_dates
                const dateDict = {};
                response[1].forEach((dataItem, idx) => {
                    const startDateKey = dataItem.reg_date.toString();
                    if (!dateDict[startDateKey]) {
                        dateDict[startDateKey] = []; // Initialize an empty array for the date if it doesn't exist
                    }
                    dateDict[startDateKey].push(idx); // Push idx to the array for this start_date
                });
                const set_start_date = Object.keys(dateDict);

                const checkDuplicate = await axios.post('/customer-support/check-duplicates',
                    {
                        set_start_date: set_start_date
                    }, {
                    headers: { 'Content-Type': 'application/json' },
                });
                if (false && checkDuplicate.data.length) { //duplicates exist
                    let errStr = "이중으로 등록될 제품들이 있습니다: \n";
                    checkDuplicate.data.forEach(start_date => {
                        dateDict[start_date].forEach(idx => {
                            errStr += `${idx + 1} 번째 상품 ${response[1][idx].goods_name} [${response[1][idx].goods_num}] 가 ${start_date} 에 이미 등록되어 있습니다.\n`
                            // 원래 response[1][idx].goods_name 대신 response[3][idx].name 인데 
                            // checking.getDataFromFile()에서 this.groupingGoods의 결과가 this.data 개수와 같을 수 있을지 의문이라 바꿈.
                        });
                    });
                    throw new Error(errStr);
                } else {
                    alert("모든 포멧과 총 주문수가 맞습니다. 해당 파일은 등록 가능합니다");
                    setOrderData(response[1])
                    setStockData(response[3])
                    setIsTestPassed(true);
                }
            }
        } catch (error) {
            setErrorTestMsg(error.message.split('\n'));
            setVisibleTestCSV(true);
        } finally {
            setLoading(false);
            return;
        }
    };

    //insert data to DB
    const submitOrderCheck = async () => {
        try {
            setLoading(true);
            //check user auth!
            const stockGood_dict = {}
            for (const stockGoodItem of stockGood) {
                stockGood_dict[stockGoodItem.good_id] = {
                    goodAlias: stockGoodItem.goodAlias,
                    goodName: stockGoodItem.goodName,
                    goodExist: stockGoodItem.goodExist,
                    cateId: stockGoodItem.cateId
                };
            }
            const insertOrder = await axios.post('/customer-support/submitOrderCheck-external-stock',
                {
                    orderData: orderData,
                    stockData: stockData,
                    stockGood_dict: stockGood_dict,
                }, {
                headers: { 'Content-Type': 'application/json' },
                withCredentials: true
            });


            alert("등록 됐습니다!")
            // reset after submit
            setLoading(false);
            setProductDetails(prevDetails => ({
                ...prevDetails,
                orderCount: ''
            }));
            setIsTestPassed(false);
            setSelectedFile(null);
            setUploadedFileName('');
            return;
        } catch (error) {
            alert(error);
            setLoading(false);
            return;
        }
    };

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
            ...prevState,
            consultationTime: getKrDate(),
            counseler: sessionStorage.getItem('name')
        }));
        setSelectedRow(selectedRow === row ? null : row)
        return;
    };

    // when user hits 조회
    const handleView = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post('/customer-support/search', productDetails, {
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
            counseler: sessionStorage.getItem('name')
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
        if (!newConsultations.content || !newConsultations.counselResult || !newConsultations.counselSection) {
            alert("모두 작성해주세요");
            return;
        }
        newConsultations["completionTime"] = getKrDate();
        newConsultations["group_uid"] = selectedRow.group_uid;
        newConsultations["external_uid"] = selectedRow.uid;
        try {
            const response = await axios.post('/customer-support/submit-consultations', newConsultations, {
                headers: { 'Content-Type': 'application/json' },
                withCredentials: true
            });
            //update consultations in page 4
            const response_search = await axios.post('/customer-support/search-consultations', selectedRow, {
                headers: { 'Content-Type': 'application/json' },
            });
            const consultations_new = transformData_counsel(response_search);
            const checkedConsultations = checkCounselResults(consultations_new)
            setSelectedRowConsult(null);
            setNewConsultations({
                consultationTime: getKrDate(),
                counseler: sessionStorage.getItem('name')
            });
            setConsultations(checkedConsultations);
            return;
        } catch (error) {
            console.error('Error fetching data:', error);
            return;
        }
    };

    // when user edits consultation 
    const handleSelectedRowConsult = async (selectedRowConsult) => {
        if (!newConsultations.content) {
            alert("상담 내용을 작성해주세요");
            return;
        }
        try {
            setLoading(true);
            newConsultations["id"] = selectedRowConsult.id
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
            const consultations_new = transformData_counsel(response_search);
            const checkedConsultations = checkCounselResults(consultations_new);
            setSelectedRowConsult(null)
            setNewConsultations({
                consultationTime: getKrDate(),
                counseler: sessionStorage.getItem('name')
            });
            setConsultations(checkedConsultations);
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
            const consultations_new = transformData_counsel(response_search);
            const checkedConsultations = checkCounselResults(consultations_new);
            setSelectedRowConsult(null)
            setNewConsultations({
                consultationTime: getKrDate(),
                counseler: sessionStorage.getItem('name')
            });
            setConsultations(checkedConsultations);
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

                        <CCol md={12}>
                            <div style={{ backgroundColor: '#f0f0f0', padding: '1rem', borderRadius: '5px' }}>
                                <CRow className="d-flex align-items-center">
                                    <div style={{ flex: 1, marginRight: '0rem' }}>
                                        <CFormLabel>첨부파일</CFormLabel>
                                    </div>
                                    <div style={{ flex: 1, marginRight: '0.5rem' }}>
                                        <CButton color="dark" type="button" onClick={handleUploadView}>파일선택</CButton>
                                    </div>

                                    <div style={{ flex: 1, marginRight: '0rem' }}>
                                        <CFormLabel>총 주문수</CFormLabel>
                                    </div>
                                    <div style={{ flex: 1, marginRight: '0.5rem' }}>
                                        <CFormInput name="orderCount" placeholder="0" value={productDetails.orderCount || ''} onChange={handleChange} />
                                    </div>

                                    <div style={{ flex: 2, marginRight: '0rem' }}>
                                        <CFormLabel>주문서 저장 및 재고 파악</CFormLabel>
                                    </div>
                                    <div style={{ flex: 1, marginRight: '0.2rem' }}>
                                        <CButton color="dark" type="button" onClick={handleOrderCheck}>
                                            TEST
                                        </CButton>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <CButton
                                            color="dark"
                                            type="button"
                                            onClick={submitOrderCheck}
                                            disabled={!isTestPassed} // Disable the button based on the test result
                                        >
                                            등록하기
                                        </CButton>
                                    </div>
                                </CRow>
                                {/* Display the uploaded file name */}
                                {uploadedFileName && <div style={{ marginTop: '1rem', fontWeight: 'bold' }}>Uploaded File: {uploadedFileName}</div>}
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
                                {errorMsg && <div className="text-danger">{errorMsg}</div>}
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

                        {/* ///////////////////////// page1: 첨부파일 test 에러메세지 start; //////////////////////////////////////////////////////////////////////////// */}
                        <CModal visible={visibleTestCSV} onClose={() => { setErrorTestMsg([]); setVisibleTestCSV(false) }}>
                            <CModalHeader>
                                <CModalTitle>제출하신 파일에 에러가 감지됐습니다</CModalTitle>
                            </CModalHeader>
                            <CModalBody>
                                {errorTestMsg.map((message, index) => (
                                    <li key={index}>{message}</li>
                                ))}
                            </CModalBody>
                            <CModalFooter>
                                <CButton color="secondary" onClick={() => { setErrorTestMsg([]); setVisibleTestCSV(false); }}>
                                    Close
                                </CButton>
                            </CModalFooter>
                        </CModal>
                        {/* ///////////////////////// page1: 첨부파일 end 에러메세지 start; //////////////////////////////////////////////////////////////////////////// */}


                        <CForm className="row g-3" style={{ marginBottom: '1rem' }}>
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
                                                    <CTableHeaderCell style={{ width: '10px' }}></CTableHeaderCell>
                                                    <CTableHeaderCell style={{ width: '100px' }}>날짜</CTableHeaderCell>
                                                    <CTableHeaderCell style={{ width: '100px' }}>수취인</CTableHeaderCell>
                                                    <CTableHeaderCell style={{ width: '100px' }}>제품명</CTableHeaderCell>
                                                    <CTableHeaderCell style={{ width: '50px' }}>처리상태</CTableHeaderCell>
                                                    <CTableHeaderCell style={{ width: '50px' }}>상담자</CTableHeaderCell>
                                                    <CTableHeaderCell style={{ width: '200px' }}>내용</CTableHeaderCell>
                                                    <CTableHeaderCell style={{ width: '50px' }}>입력자</CTableHeaderCell>
                                                    <CTableHeaderCell style={{ width: '10px' }}>확인</CTableHeaderCell>
                                                </CTableRow>
                                            </CTableHead>
                                            <CTableBody>
                                                {consultationsASTable.map((row) => (
                                                    <CTableRow key={row.id}>
                                                        <CTableDataCell>
                                                            <CFormCheck
                                                                type="radio"
                                                                onChange={() => handleCheckboxChangeConsultationsTable(row)}
                                                                checked={selectedRowConsultationsTable === row}
                                                            />
                                                        </CTableDataCell>
                                                        <CTableDataCell>{row.startDate}</CTableDataCell>
                                                        <CTableDataCell>{row.recipient}</CTableDataCell>
                                                        <CTableDataCell>{row.productName}</CTableDataCell>
                                                        <CTableDataCell>{row.counselResult}</CTableDataCell>
                                                        <CTableDataCell>{row.counseler}</CTableDataCell>
                                                        <CTableDataCell>{row.content}</CTableDataCell>
                                                        <CTableDataCell>{row.manager}</CTableDataCell>
                                                        <CTableDataCell>
                                                            <CButton color="dark" onClick={() => { setVisibleASTableConfirmModal(true); setSelectedRowResASTable(row) }}>
                                                                확인
                                                            </CButton>
                                                        </CTableDataCell>
                                                    </CTableRow>
                                                ))}
                                            </CTableBody>
                                        </CTable>
                                    </div>



                                </CModalBody>
                                <CModalFooter>
                                    <CButton color="secondary" onClick={() => setVisibleASTable(false)}>Close</CButton>
                                </CModalFooter>
                            </CModal>

                            <CCol md={2}>
                                <CFormLabel>날짜별 상담</CFormLabel>
                                <div className="d-flex align-items-center">
                                    <CButton color="dark" type="button" onClick={handleConsultationsView}>상담내역 보기</CButton>
                                </div>
                            </CCol>
                            <CModal visible={visibleConsultationsTable} onClose={() => setVisibleConsultationsTable(false)} size="xl">
                                <CModalHeader onClose={() => setVisibleConsultationsTable(false)}>
                                    <CModalTitle>날짜별 상담내역</CModalTitle>
                                </CModalHeader>
                                <CModalBody>
                                    {/* Consultation Table; consultationsDateTable */}
                                    <div style={{ height: '300px', overflowY: 'scroll' }}>
                                        <CTable hover striped>
                                            <CTableHead>
                                                <CTableRow>
                                                    <CTableHeaderCell style={{ width: '10px' }}></CTableHeaderCell>
                                                    <CTableHeaderCell style={{ width: '100px' }}>상담구분</CTableHeaderCell>
                                                    <CTableHeaderCell style={{ width: '100px' }}>처리상태</CTableHeaderCell>
                                                    <CTableHeaderCell style={{ width: '50px' }}>상담원</CTableHeaderCell>
                                                    <CTableHeaderCell style={{ width: '50px' }}>구매자</CTableHeaderCell>
                                                    <CTableHeaderCell style={{ width: '400px' }}>내용</CTableHeaderCell>
                                                </CTableRow>
                                            </CTableHead>
                                            <CTableBody>
                                                {consultationsDateTable.map((row) => (
                                                    <CTableRow key={row.id}>
                                                        <CTableDataCell>
                                                            <CFormCheck
                                                                type="radio"
                                                                onChange={() => handleCheckboxChangeASTable(row)}
                                                                checked={selectedRowASTable === row}
                                                            />
                                                        </CTableDataCell>
                                                        <CTableDataCell>{row.counselSection}</CTableDataCell>
                                                        <CTableDataCell>{row.counselResult}</CTableDataCell>
                                                        <CTableDataCell>{row.counseler}</CTableDataCell>
                                                        <CTableDataCell>{row.buyerName}</CTableDataCell>
                                                        <CTableDataCell>{row.content}</CTableDataCell>
                                                    </CTableRow>
                                                ))}
                                            </CTableBody>
                                        </CTable>
                                    </div>



                                </CModalBody>
                                <CModalFooter>
                                    <CButton color="secondary" onClick={() => setVisibleConsultationsTable(false)}>Close</CButton>
                                </CModalFooter>
                            </CModal>



                            {/* Reconfirmation Modal */}
                            <CModal visible={visibleASTableConfirmModal} onClose={() => setVisibleASTableConfirmModal(false)} size="sm">
                                <CModalHeader onClose={() => setASTableVisibleConfirmModal(false)}>
                                    <CModalTitle>확인</CModalTitle>
                                </CModalHeader>
                                <CModalBody>이 작업을 진행하시겠습니까?</CModalBody>
                                <CModalFooter>
                                    <CButton color="primary" onClick={handleASTableConfirm}>네</CButton>
                                    <CButton color="secondary" onClick={handleASTableCancel}>아니요</CButton>
                                </CModalFooter>
                            </CModal>

                            {/* ///////////////////////// page1: AS 현황 검색 end //////////////////////////////////////////////////////////////////////////// */}


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
                            {/* 조회 버튼 */}
                            <CCol xs={2}>
                                <div style={{ marginTop: '2rem' }}> {/* Adding space above the button */}
                                    <CButton color="primary" type="submit" onClick={handleView}>조회</CButton>
                                </div>
                            </CCol>
                            {/* 다운로드 버튼 */}
                            <CCol xs={2}>
                                <div style={{ marginTop: '2rem' }}> {/* Adding space above the button */}
                                    <CButton color="secondary" type="button" onClick={downloadCSV} style={{ marginLeft: '10px' }}>CSV 다운로드</CButton>
                                </div>
                            </CCol>

                        </CForm>
                        {/* ///////////////////////// page1: 주문 검색 end //////////////////////////////////////////////////////////////////////////// */}


                        {/* ///////////////////////// page2: 결과 화면; tableData start //////////////////////////////////////////////////////////////////////////// */}

                        <div style={{ height: '300px', overflowY: 'scroll' }}>
                            <table className="custom-table">
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
                                            className={getRowClassConsultation(row.counselResult)}
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
                                {!selectedRowConsult && (
                                    <>
                                        <h4 className="custom-header-consultation">고객 상담 내역 등록하기</h4>
                                        <CForm>
                                            <CRow className="mb-3">
                                                <CCol style={{ width: '12.5%' }}>
                                                    <CFormLabel>상담구분</CFormLabel>
                                                    <Select
                                                        name="counselSection"
                                                        options={counselSection.slice(1)}
                                                        onChange={handleSelectChange_Consult}
                                                        value={newConsultations.counselSection || ""}
                                                        isSearchable
                                                    />
                                                </CCol>
                                                <CCol style={{ width: '12.5%' }}>
                                                    <CFormLabel>처리결과</CFormLabel>
                                                    <Select
                                                        name="counselResult"
                                                        options={counselResult.slice(1)}
                                                        onChange={handleSelectChange_Consult}
                                                        value={newConsultations.counselResult || ""}
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
                                                <CCol style={{ width: '12.5%' }}>
                                                    <CFormLabel>상담구분</CFormLabel>
                                                    <CFormInput type="text" name="counselSection" value={selectedRowConsult.counselSection || ''} readOnly />
                                                </CCol>
                                                <CCol style={{ width: '12.5%' }}>
                                                    <CFormLabel>처리결과</CFormLabel>
                                                    <CFormInput type="text" name="counselResult" value={selectedRowConsult.counselResult || ''} readOnly />
                                                </CCol>
                                                {/* 상담구분과 처리결과 또한 수정 가능하도록 하고 싶은 경우 밑에 코드를 uncomment하고 위 코드를 comment 해주세요 */}
                                                {/* <CCol style={{ width: '12.5%' }}>
                                                    <CFormLabel>상담구분</CFormLabel>
                                                    <Select
                                                        name="counselSection"
                                                        options={counselSection.slice(1)}
                                                        onChange={handleSelectChange_Consult}
                                                        placeholder={selectedRowConsult.counselSection}
                                                        value={newConsultations.counselSection || ""}
                                                        isSearchable
                                                    />
                                                </CCol>
                                                <CCol style={{ width: '12.5%' }}>
                                                    <CFormLabel>처리결과</CFormLabel>
                                                    <Select
                                                        name="counselResult"
                                                        options={counselResult.slice(1)}
                                                        onChange={handleSelectChange_Consult}
                                                        placeholder={selectedRowConsult.counselResult}
                                                        value={newConsultations.counselResult || ""}
                                                        isSearchable
                                                    />
                                                </CCol> */}
                                                <CCol md={3}>
                                                    <CFormLabel>상담시간</CFormLabel>
                                                    <CFormInput type="text" name="startDate" value={selectedRowConsult.startDate || ''} readOnly />
                                                </CCol>
                                                <CCol md={3}>
                                                    <CFormLabel>완료시간</CFormLabel>
                                                    <CFormInput type="text" name="endDate" value={selectedRowConsult.endDate || ''} readOnly />
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
                                                <th> </th>
                                                <th style={{ width: '8%' }}>상담구분</th>
                                                <th style={{ width: '7%' }}>처리상태</th>
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
                                                            checked={selectedRowConsult === row}
                                                        />
                                                    </td>
                                                    <td>{row.counselSection}</td>
                                                    <td>{row.counselResult}</td>
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

export default CustomerSupport
