// import React, { useState } from 'react'
// import { CCard, CCardBody, CCol, CCardHeader, CRow, CNav, CNavItem, CNavLink, CCollapse } from '@coreui/react'
// import {
//   CChartBar,
//   CChartDoughnut,
//   CChartLine,
//   CChartPie,
//   CChartPolarArea,
//   CChartRadar,
// } from '@coreui/react-chartjs'
// import { DocsCallout } from 'src/components'

// const viewSales = () => {
//   const random = () => Math.round(Math.random() * 100)
//   const [visibleTable, setVisibleTable] = useState(false)
//   const [visibleLineChart, setVisibleLineChart] = useState(false)

//   return (
//     <CRow>
//         <CCol xs={12}>
//             <CCard className="mb-4">
//                 <CNav variant="tabs">
//                     <CNavItem>
//                         <CNavLink onClick={() => {setVisibleTable(!visibleTable)
//                             setVisibleLineChart(visibleLineChart)}
//                             }>
//                             Table
//                         </CNavLink>
//                     </CNavItem>
//                     <CNavItem>
//                         <CNavLink onClick={() => {setVisibleTable(visibleTable)
//                             setVisibleLineChart(!visibleLineChart)}
//                             }>
//                             Line Chart
//                         </CNavLink>
//                     </CNavItem>
//                 </CNav>
//                 <CRow>
//                     <CCol xs={12}>
//                         <CCollapse visible={visibleTable}>
//                             <CCard className="mt-3">
//                                 <CCardBody>
//                                     <CChartLine
//                                         data={{
//                                         labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
//                                         datasets: [
//                                         {
//                                             label: '월별 판매량',
//                                             backgroundColor: '#f87979',
//                                             data: [40, 20, 12, 39, 10, 40, 39, 80, 40],
//                                         },
//                                         ],
//                                     }}
//                                     labels="months"
//                                     />
//                                 </CCardBody>
//                             </CCard>
//                         </CCollapse>
//                     </CCol>
//                     <CCol xs={12}>
//                         <CCollapse visible={visibleLineChart}>
//                             <CCard className="mt-3">
//                                 <CCardBody>
//                                     <CChartBar
//                                     data={{
//                                         labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
//                                         datasets: [
//                                         {
//                                             label: 'GitHub Commits',
//                                             backgroundColor: '#f87979',
//                                             data: [40, 20, 12, 39, 10, 40, 39, 80, 40],
//                                         },
//                                         ],
//                                     }}
//                                     labels="months"
//                                     />
//                                 </CCardBody>
//                             </CCard>
//                         </CCollapse>
//                     </CCol>
//                 </CRow>
//             </CCard>
//         </CCol>
//     </CRow>
//   )
// }

// export default viewSales
import React, { useState, useEffect } from 'react';
import { CCard, CCardBody, CCol, CCardHeader, CRow, CNav, CNavItem, CNavLink, CCollapse } from '@coreui/react';
import { CChartBar, CChartLine } from '@coreui/react-chartjs';
import axios from 'axios';

const ViewSales = () => {
  const [orders, setOrders] = useState([]);
  const [visibleTable, setVisibleTable] = useState(false);
  const [visibleLineChart, setVisibleLineChart] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8080/sales/view-sales');
        const data = await response.json();
        setOrders(data.orders);
        console.log(data);
        console.log('data sent')
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };
    fetchData();
  }, []);
  

  // Example of how you might use the fetched data in your charts
  const salesData = orders.map(order => order.productID); // Assuming each order has an 'amount' field
  const salesLabels = orders.map(order => order.productCount); // Assuming each order has a 'date' field

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CNav variant="tabs">
            <CNavItem>
              <CNavLink onClick={() => {setVisibleTable(!visibleTable); setVisibleLineChart(visibleLineChart)}}>
                Table
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink onClick={() => {setVisibleTable(visibleTable); setVisibleLineChart(!visibleLineChart)}}>
                Line Chart
              </CNavLink>
            </CNavItem>
          </CNav>
          <CCollapse visible={visibleTable}>
            <CCardBody>
              {/* Displaying fetched data */}
              {orders.map(order => (
                <div key={order._id}>{order.name} - ${order.amount}</div> // Adjust fields based on your actual data structure
              ))}
            </CCardBody>
          </CCollapse>
          <CCollapse visible={visibleLineChart}>
            <CCardBody>
              <CChartLine
                data={{
                  labels: salesLabels,
                  datasets: [{
                    label: '월별 판매량',
                    backgroundColor: '#f87979',
                    data: salesData,
                  }],
                }}
                labels="months"
              />
            </CCardBody>
          </CCollapse>
        </CCard>
      </CCol>
    </CRow>
  );
}

export default ViewSales;
