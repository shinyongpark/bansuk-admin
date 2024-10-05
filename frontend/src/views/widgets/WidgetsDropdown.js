import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  CButton,
  CRow,
  CCol,
  CDropdown,
  CDropdownMenu,
  CDropdownItem,
  CDropdownToggle,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CWidgetStatsA,
} from '@coreui/react'
import { getStyle } from '@coreui/utils'
import { CChartBar, CChartLine } from '@coreui/react-chartjs'
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import CIcon from '@coreui/icons-react'
import { cilArrowBottom, cilArrowTop, cilOptions, cilMobile, cilNotes, cilClock } from '@coreui/icons'

const WidgetsDropdown = (props) => {
  const widgetChartRef1 = useRef(null)
  const widgetChartRef2 = useRef(null)

  const [counselSection, setCounselSection] = useState([]);
  const [counselResult, setCounselResult] = useState([]);
  const [consultationsASTable, setConsultationsASTable] = useState([])
  const [consultationsDateTable, setConsultationsDateTable] = useState([]);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const [dateNY, setDateNY] = useState(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));



  // useEffect(() => {
  //   document.documentElement.addEventListener('ColorSchemeChange', () => {
  //     if (widgetChartRef1.current) {
  //       setTimeout(() => {
  //         widgetChartRef1.current.data.datasets[0].pointBackgroundColor = getStyle('--cui-primary')
  //         widgetChartRef1.current.update()
  //       })
  //     }

  //     if (widgetChartRef2.current) {
  //       setTimeout(() => {
  //         widgetChartRef2.current.data.datasets[0].pointBackgroundColor = getStyle('--cui-info')
  //         widgetChartRef2.current.update()
  //       })
  //     }
  //   })
  // }, [widgetChartRef1, widgetChartRef2])

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     if (widgetChartRef1.current) {
  //       widgetChartRef1.current.update();
  //     }

  //     if (widgetChartRef2.current) {
  //       widgetChartRef2.current.update();
  //     }
  //   }, 1000); // Call the function every 1000 milliseconds (1 second)

  //   return () => clearInterval(interval);
  // }, [widgetChartRef1, widgetChartRef2]);

  useEffect(() => {
    const fetchDataAndTables = async () => {
      const [parsedCounselSection, parsedCounselResult] = await getList();
      await getASTable(parsedCounselSection, parsedCounselResult);
      await getDateConsultTable(parsedCounselSection, parsedCounselResult);
      setNotes('');
    };

    fetchDataAndTables();
  }, []); // Runs once when the component mounts

  //////////////// helper functions /////////////////////////////////////////////////////////////////////////////////
  const getList = async () => {
    try {
      const response = await axios.get('https://bs-admin.com:443/get-select-list');
      const parsedCounselSection = response.data.counsel_section.map((item) =>
        item === "" ? "미선택" : item
      );
      setCounselSection(parsedCounselSection);

      const parsedCounselResult = response.data.counsel_result.map((item) =>
        item === "" ? "미선택" : item
      );
      setCounselResult(parsedCounselResult);
      return [parsedCounselSection, parsedCounselResult]
    } catch (error) {
      console.error("Error fetching list: ", error);
      return;
    }
  };

  const getASTable = async (parsedCounselSection = null, parsedCounselResult = null) => {
    try {
      const response = await axios.get('https://bs-admin.com:443/customer-support/search-ASTable');
      const consultations = response.data.map(item => ({
        id: item.uid,
        startDate: item.reg_date.split('T')[0],
        recipient: item.name,
        productName: item.good_name,
        content: item.counsel_content,
      }));
      setConsultationsASTable(consultations);
    } catch (error) {
      console.error('Error fetching ASTable data:', error);
    }
  };

  const getDateConsultTable = async (parsedCounselSection = null, parsedCounselResult = null) => {
    const productDetails = {};
    try {
      const response = await axios.post('https://bs-admin.com:443/customer-support/search-ConsultationsTable', productDetails, {
        headers: { 'Content-Type': 'application/json' },
      });
      const consultations = response.data.map(item => ({
        id: item.uid,
        startDate: item.reg_date.split('T')[0],
        counseler: item.table === "c" ? item.counseler : item.manager,
        counselResult: counselResult.length ? counselResult[Number(item.counsel_result)] : parsedCounselResult[Number(item.counsel_result)],
        content: item.counsel_content,
        buyerName: item.buyer_name || '',
      }));
      setConsultationsDateTable(consultations);
    } catch (error) {
      console.error('Error fetching ConsultationsTable data:', error);
    }
  };

  const handleNoteChange = (e) => {
    setNotes(e.target.value);
  };

  const handleNoteSubmit = () => {
    // Logic to save the note as a .txt file
    const blob = new Blob([notes], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = `note_${(new Date).toISOString().replace(/:/g, '-')}.txt`;
    a.download = filename
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setNotes('');
  };

  return (
    <CRow className={props.className} xs={{ gutter: 4 }}>
      <CCol sm={12} xl={6} xxl={4}>
        <CWidgetStatsA
          color="info"
          value={
            <>
              한국 시간{' '}
              <span className="fs-6 fw-normal">
                ({date}
                <CIcon icon={cilClock} />)
              </span>
            </>
          }
          title="달력"
          action={
            <CDropdown alignment="end">
              <CDropdownToggle color="transparent" caret={false} className="text-white p-0">
                <CIcon icon={cilOptions} />
              </CDropdownToggle>
              <CDropdownMenu>
                {/* <CDropdownItem>Action</CDropdownItem>
                <CDropdownItem>Another action</CDropdownItem>
                <CDropdownItem>Something else here...</CDropdownItem>
                <CDropdownItem disabled>Disabled action</CDropdownItem> */}
              </CDropdownMenu>
            </CDropdown>
          }
          chart={
            <div style={{
              height: '100%',
              width: '100%',
              // display: 'flex',
              justifyContent: 'center',
              borderRadius: '5px'
            }} className="calendar">
              <Calendar
                // onChange={setDate}
                value={date}
                style={{ width: '100%', height: '100%' }} // Make sure the calendar uses full width and height
              />
            </div>
          }
        />
      </CCol>
      <CCol sm={12} xl={6} xxl={4}>
        <CWidgetStatsA
          color="secondary"
          value={
            <>
              뉴욕 시간{' '}
              <span className="fs-6 fw-normal">
                ({dateNY}
                <CIcon icon={cilClock} />)
              </span>
            </>
          }
          title="달력"
          action={
            <CDropdown alignment="end">
              <CDropdownToggle color="transparent" caret={false} className="text-white p-0">
                <CIcon icon={cilOptions} />
              </CDropdownToggle>
              <CDropdownMenu>
                {/* <CDropdownItem>Action</CDropdownItem>
                <CDropdownItem>Another action</CDropdownItem>
                <CDropdownItem>Something else here...</CDropdownItem>
                <CDropdownItem disabled>Disabled action</CDropdownItem> */}
              </CDropdownMenu>
            </CDropdown>
          }
          chart={
            <div style={{
              height: '100%',
              width: '100%',
              justifyContent: 'center',
              borderRadius: '5px'
            }} className="calendar">
              <Calendar
                // onChange={setDateNY}
                value={dateNY}
                style={{ width: '100%', height: '100%' }} // Make sure the calendar uses full width and height
              />
            </div>
          }
        />
      </CCol>
      <CCol sm={12} xl={6} xxl={4}>
        <CWidgetStatsA
          color="danger"
          value={
            <>
              노트{' '}
              <span className="fs-6 fw-normal">
                <CButton color="light" onClick={handleNoteSubmit} style={{ marginBottom: '10px', marginLeft: '10px' }}>
                  다운받기
                </CButton>
              </span>
            </>
          }
          title=""
          action={
            <CDropdown alignment="end">
              <CDropdownToggle color="transparent" caret={false} className="text-white p-0">
                <CIcon icon={cilOptions} />
              </CDropdownToggle>
              <CDropdownMenu>
                {/* <Link to="/sales/customer-support" className="dropdown-item"> 고객관리에서 자세히 보기 </Link> */}
                {/* <CDropdownItem onClick={getTotalSale}> AS 현황 새로고침 </CDropdownItem> */}
              </CDropdownMenu>
            </CDropdown>
          }
          chart={
            <div style={{
              height: '300px',
              overflowY: 'auto',
              display: 'flex',
              justifyContent: 'center',
              borderRadius: '5px'
            }}>
              <textarea
                value={notes}
                onChange={handleNoteChange}
                placeholder="여기에 노트를 작성하세요..."
                style={{
                  width: '100%',
                  height: '100%',
                  marginBottom: '10px',
                  borderRadius: '5px',
                  padding: '5px',
                  border: '1px solid #ccc'
                }}
              />
            </div>
          }
        />
      </CCol>
      <CCol sm={8} xl={4} xxl={6}>
        <CWidgetStatsA
          color="dark"
          value={
            <>
              AS 현황{' '}
              <span className="fs-6 fw-normal">
                ({consultationsASTable.length} 건 <CIcon icon={cilMobile} />)
              </span>
            </>
          }
          title=""
          action={
            <CDropdown alignment="end">
              <CDropdownToggle color="transparent" caret={false} className="text-white p-0">
                <CIcon icon={cilOptions} />
              </CDropdownToggle>
              <CDropdownMenu>
                <Link to="/sales/customer-support" className="dropdown-item"> 고객관리에서 자세히 보기 </Link>
                <CDropdownItem onClick={getASTable}> AS 현황 새로고침 </CDropdownItem>
              </CDropdownMenu>

            </CDropdown>
          }
          chart={
            <div style={{
              height: '300px',
              overflowY: 'auto',
              display: 'flex',
              justifyContent: 'center',
              borderRadius: '5px'
            }}>
              <CTable hover small responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell style={{ width: '100px' }}>날짜</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: '120px' }}>수취인</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: '120px' }}>제품명</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: '250px' }}>내용</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {consultationsASTable.map((row) => (
                    <CTableRow key={row.id}>
                      <CTableDataCell>{row.startDate}</CTableDataCell>
                      <CTableDataCell>{row.recipient}</CTableDataCell>
                      <CTableDataCell>{row.productName}</CTableDataCell>
                      <CTableDataCell>{row.content}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </div>
          }
        />
      </CCol>
      <CCol sm={8} xl={4} xxl={6}>
        <CWidgetStatsA
          color="warning"
          value={
            <>
              금일 상담 내역{' '}
              <span className="fs-6 fw-normal">
                ({consultationsDateTable.length} 건 <CIcon icon={cilNotes} />)
              </span>
            </>
          }
          title=""
          action={
            <CDropdown alignment="end">
              <CDropdownToggle color="transparent" caret={false} className="text-white p-0">
                <CIcon icon={cilOptions} />
              </CDropdownToggle>
              <CDropdownMenu>
                <Link to="/sales/customer-support" className="dropdown-item"> 고객관리에서 자세히 보기 </Link>
                <CDropdownItem onClick={getDateConsultTable}> 금일 상담 내역 새로고침 </CDropdownItem>
              </CDropdownMenu>

            </CDropdown>
          }
          chart={
            <div style={{
              height: '300px',
              overflowY: 'auto',
              display: 'flex',
              justifyContent: 'center',
              borderRadius: '5px'
            }}>
              <CTable hover striped>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell style={{ width: '100px' }}>날짜</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: '70px' }}>처리상태</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: '100px' }}>구매자</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: '250px' }}>내용</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {consultationsDateTable.map((row) => (
                    <CTableRow key={row.id}>
                      <CTableDataCell>{row.startDate}</CTableDataCell>
                      <CTableDataCell>{row.counselResult}</CTableDataCell>
                      <CTableDataCell>{row.buyerName}</CTableDataCell>
                      <CTableDataCell>{row.content}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </div>
          }
        />
      </CCol>
    </CRow>
  )
}

WidgetsDropdown.propTypes = {
  className: PropTypes.string,
  withCharts: PropTypes.bool,
}

export default WidgetsDropdown
