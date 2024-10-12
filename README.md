
# Bansuk Admin Project

**Authors:** Shinyong Park (박신영), Andrew Junhee Park (박준희)  
**Last Update:** October 2024

## About the Project

The Bansuk Admin Project is a comprehensive administrative application designed specifically for Bansuk Sports. This application provides a robust platform for employees to efficiently manage various operational aspects including:

- Sales counts
- Product inventory
- Pricing adjustments
- Revenue tracking
- Customer support services

## Technologies Used

- **JavaScript**: For client-side and server-side scripting.
- **Node.js**: As an asynchronous event-driven JavaScript runtime, Node.js is designed to build scalable network applications.
- **React.js**: A JavaScript library for building user interfaces, primarily aimed at rich interactive web apps.
- **CoreUI**: A UI toolkit for React built with Bootstrap to speed up the development of UI components.
- **MongoDB**: A NoSQL database used to store application data in a flexible, JSON-like format.
- **Python**: Used for scripting and automation tasks not directly handled by the Node.js environment.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Git
- npm (Node.js package manager)
- Node.js

### Installation

1. **Clone the Repository**

   ```bash
   git clone https://example.com/bansuk-admin.git
   cd bansuk-admin
   ```
2.  **Set Up the Backend**
    
    Navigate to the backend directory and install dependencies:
    
    ```bash
    cd backend
    npm install
    ``` 
    
3.  **Configure Environment Variables**
    
    Edit the `.env` file to include the correct database URLs and any other environment-specific settings.
    
4.  **Set Up the Frontend**
    
    Move to the frontend directory, install dependencies, and build the React application:
    ```bash
    cd frontend
    npm install
    npm run build
    ```
    
5.  **Run the Application**
    
    Return to the root directory and start the server using `nodemon`:

    ```bash
    cd ..
    nodemon server.js
    ```
    
    Alternatively, if you don't have `nodemon` installed, you can start the server using Node:
    ```bash
    node server.js
    ```
    

## Usage

After starting the server, the application will be accessible at `http://localhost:3000` or another port specified in your `.env` file. Use the application to manage sales data, products, and customer interactions as needed.

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## Contact

Shinyong Park - shinyonp@andrew.cmu.edu  
Andrew Junhee Park - ajpark@andrew.cmu.edu

Project Link: [https://github.com/shinyongpark/bansuk-admin](https://github.com/shinyongpark/bansuk-admin)