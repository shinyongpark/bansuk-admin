import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CNav,
  CNavItem,
  CNavLink,
  CCollapse,
  CFormSelect,
  CFormInput,
  CButton,
} from '@coreui/react';
import {
  CChartBar,
  CChartDoughnut,
  CChartLine,
  CChartPie,
  CChartPolarArea,
  CChartRadar,
} from '@coreui/react-chartjs'
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const SalesDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [visibleTable, setVisibleTable] = useState(true);
  const [visibleLineChart, setVisibleLineChart] = useState(false);

  //ex
  const categories = [
    { id: 1, name: "전자기기" },
    { id: 2, name: "가구" },
    { id: 3, name: "주방용품" }
  ];
  const products = {
    1: ["노트북", "스마트폰", "태블릿"], // Products for category '전자기기'
    2: ["책상", "의자", "소파"],          // Products for category '가구'
    3: ["냄비", "프라이팬", "접시"]      // Products for category '주방용품'
  };
  const entryTypes = ["입고", "출고", "반품"]; // Entry types

  // Fetch orders based on selected month and year
  const handleView = async () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1; // months are zero-indexed
    try {
      const response = await axios.get(`http://localhost:8080/sales/orders?year=${year}&month=${month}`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleChange = (e) => {
    if (e.hasOwnProperty('target')) {
      const { name, value } = e.target;
      setUserInput(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      userInput.category = e.value;
    }
  };

  // Calculate number of days in the selected month
  const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CNav variant="tabs">
            <CNavItem>
              <CNavLink onClick={() => { setVisibleTable(true); setVisibleLineChart(false); }}>
                Table
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink onClick={() => { setVisibleTable(false); setVisibleLineChart(true); }}>
                Line Chart
              </CNavLink>
            </CNavItem>
          </CNav>
          <CCardHeader>
            <div className="d-flex align-items-center">
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                dateFormat="yyyy-MM"
                showMonthYearPicker
              />
              <div className="w-auto mx-2" style={{ minWidth: '200px' }}>
                <Select
                  options={categories}
                  name='category'
                  onChange={handleChange}
                  isSearchable={true}
                  placeholder="Select a category..."
                />
              </div>
              <CButton color="primary" type="button" onClick={handleView}>조회</CButton>
            </div>
          </CCardHeader>
          <CCollapse visible={visibleTable}>
            <CCardBody>
              <CTable hover>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell scope="col">분류</CTableHeaderCell>
                    <CTableHeaderCell scope="col">제품명</CTableHeaderCell>
                    <CTableHeaderCell scope="col">입고구분</CTableHeaderCell>
                    {/* Dynamic date columns */}
                    {Array.from({ length: daysInMonth }, (_, i) => (
                      <CTableHeaderCell key={i + 1} scope="col">{i + 1}</CTableHeaderCell>
                    ))}
                    <CTableHeaderCell scope="col">총 판매량</CTableHeaderCell>
                    <CTableHeaderCell scope="col">반석재고</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {orders.map(order => (
                    <CTableRow key={order._id}>
                      <CTableDataCell>{order.category}</CTableDataCell>
                      <CTableDataCell>{order.goods_name}</CTableDataCell>
                      <CTableDataCell>{order.entry_type}</CTableDataCell>
                      {/* Dynamic date columns */}
                      {Array.from({ length: daysInMonth }, (_, i) => (
                        <CTableDataCell key={i + 1}>
                          {order.daily_sales[i] || 0} {/* Adjust based on actual data */}
                        </CTableDataCell>
                      ))}
                      {/* 총 판매량 */}
                      <CTableDataCell>
                        {order.daily_sales.reduce((acc, curr) => acc + (curr || 0), 0)}
                      </CTableDataCell>
                      {/* 반석재고 */}
                      <CTableDataCell>{order.remaining_stock}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCollapse>
          <CCollapse visible={visibleLineChart}>
            <CCardBody>
              <CChartLine
                data={{
                  labels: Array.from(new Array(30), (_, i) => i + 1), // Assuming 30 days in a month for simplicity
                  datasets: [{
                    label: 'Daily Sales',
                    backgroundColor: '#f87979',
                    data: orders.map(order => order.goods_num), // Adjust as per actual data key for quantities
                  }],
                }}
                labels="days"
              />
            </CCardBody>
          </CCollapse>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default SalesDashboard;