import React, { useState, useEffect } from 'react';
import axios from 'axios';
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


const SalesDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [visibleTable, setVisibleTable] = useState(true);
  const [visibleLineChart, setVisibleLineChart] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedProduct, setSelectedProduct] = useState('');

  // Fetching order data based on selected month and year
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/sales/orders?year=${selectedYear}&month=${selectedMonth}`);
        setOrders(response.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchOrders();
  }, [selectedMonth, selectedYear]);

  // Selecting years for dropdown
  const years = Array.from(new Array(20), (val, index) => new Date().getFullYear() - index);

  // Handling product selection for chart
  const handleProductSelect = (productId) => {
    setSelectedProduct(productId);
    // Additional fetch or adjustments for chart can be made here
  };

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
              <CFormSelect className="w-auto" onChange={(e) => setSelectedYear(e.target.value)}>
                {years.map(year => <option key={year} value={year}>{year}</option>)}
              </CFormSelect>
              <CFormSelect className="w-auto mx-2" onChange={(e) => setSelectedMonth(e.target.value)}>
                {Array.from(new Array(12), (v, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
              </CFormSelect>
            </div>
          </CCardHeader>
          <CCollapse visible={visibleTable}>
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
                  {orders.map(order => (
                    <CTableRow key={order._id}>
                      <CTableDataCell>{order.goods_name}</CTableDataCell>
                      <CTableDataCell>{order.comments}</CTableDataCell>
                      <CTableDataCell>{order.goods_uid}</CTableDataCell>
                      <CTableDataCell>{order.warehouse}</CTableDataCell>
                      <CTableDataCell>{order.supply_price}</CTableDataCell>
                      <CTableDataCell>{order.selling_price}</CTableDataCell>
                      <CTableDataCell>{order.mod_date}</CTableDataCell>
                      <CTableDataCell><CFormInput /></CTableDataCell>
                      <CTableDataCell>
                        <CButton color="primary" onClick={() => handleCostUpdate(order._id)}>Update</CButton>
                      </CTableDataCell>
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
