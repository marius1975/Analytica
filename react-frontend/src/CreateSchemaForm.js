

import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import React, { useState, useEffect, useRef } from 'react';
import { useFilter } from './FilterContext';

import './CreateSchemaForm.css';
import './LoginForm.js';

function CreateSchemaForm({ isLoggedIn, onCreateSchema}){
  const [dbName, setDbName] = useState('');
  const [databases, setDatabases] = useState([]);
  const [selectedDatabase, setSelectedDatabase] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ top: 0, left: 0 });
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileUploadModalVisible, setFileUploadModalVisible] = useState(false);
  const [tablesInDatabase, setTablesInDatabase] = useState([]);
  const [displayTables, setDisplayTables] = useState(false);
  const [selectedTable, setSelectedTable] = useState(''); //null
  const [tableOrder, setTableOrder] = useState([]);
  const contextMenuRef = useRef(null);
  const [tableData, setTableData] = useState([]);
  const [filteredTableData, setFilteredTableData] = useState([]);

  const [droppedFile, setDroppedFile] = useState(null);
  const [isFileDropped, setIsFileDropped] = useState(false);
  const [selectedTableData, setSelectedTableData] = useState([]); // Track selected table data
  const [selectedTableName, setSelectedTableName] = useState(''); // Track selected table name
  const [displayedData, setDisplayedData] = useState([]);
  const [contextMenuVisible_2, setContextMenuVisible_2] = useState(false);
//added
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [totalTablePages, setTotalTablePages] = useState(1);

  const [filteredPage, setFilteredPage] = useState(1);
  const[totalFilteredRecords, setTotalFilteredRecords] = useState(0);
  const [totalFilteredPages, setTotalFilteredPages] = useState(1);


  const [totalRecords, setTotalRecords] = useState(0); // Add a state for total pages




  //new
  const [distinctValues, setDistinctValues] = useState({}); // State to store distinct column values
  const [selectedValues, setSelectedValues] = useState({}); // State to store selected values for filtering
  const [columns, setColumns] = useState([]);
  const [columnName, setColumnName] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputValues, setInputValues] = useState({});
  const [filteredValues, setFilteredValues] = useState({});
  const [isListOpen, setIsListOpen] = useState({});
  const [isFiltering, setIsFiltering] = useState(false);
  //new
  const {filters, setFilter } = useFilter();
 /* useEffect(() => {
      // Fetch filtered data based on filters
      await fetchFilteredData();
    }, [filters]);*/
    // This useEffect is for handling next and previous button clicks
      /*useEffect(() => {
        // Fetch filtered data when the page or pageSize changes
        fetchFilteredData();
      }, [filters, page, pageSize]);*/
      const handleFilterChange = (column, value) => {
          // Update filters when needed
          setFilter(column, value);
        };

// useEffect for fetching table data

useEffect(() => {
  const fetchTable = async () => {
    if (selectedDatabase && selectedTable && !isFiltering) {
      await handleTableSelect();
      columns.forEach((column) => {
        handleValueSelect(column, '');
      });
      await fetchTableData(page, pageSize);
      fetchTotalRecords();
    }
  };

  fetchTable();
}, [selectedDatabase, selectedTable, page, pageSize, isFiltering]);






// Add a console.log statement to check the value of isFiltering
useEffect(() => {
  console.log('isFiltering:', isFiltering);
}, [isFiltering]);



    useEffect(()=>{
    setPage(1);
    },[selectedTable]);

  useEffect(() => {
    if (isLoggedIn) {
      fetch('http://localhost:8082/api/user-databases')
        .then((response) => {
          if (response.status === 200) {
            return response.json();
          } else {
            throw new Error('Unauthorized');
          }
        })
        .then((data) => setDatabases(data))
        .catch((error) => {
          console.error(error);
        });
    }
  }, [isLoggedIn]);



  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    console.log('Dropped File:', file);
    setSelectedFile(file);
    setIsFileDropped(true);
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setIsFileDropped(false);
  };

  const handleCreateDatabase = async () => {
    if (!dbName) {
      console.error('Database name cannot be empty');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8082/api/create-database/${dbName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const createdDatabaseName = await response.text();
        console.log('Database created successfully:', createdDatabaseName);
        setDbName('');
        setDatabases([...databases, createdDatabaseName]);
      } else {
        console.error('Failed to create the database');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleContextMenu = (e, tableName) => {
    e.preventDefault();
    setSelectedOption(null);

    if (selectedDatabase) {
      const top = e.clientY;
      const left = e.clientX;

      setContextMenuPosition({ top, left });
      setSelectedTable(tableName); // Set the selected table
      setContextMenuVisible(true);

    }
  };

const handleContextMenu_2 = (e, tableName) => {
    e.preventDefault();
    setSelectedOption(null);

    if (selectedTable) {
      const top = e.clientY;
      const left = e.clientX;

      setContextMenuPosition({ top, left });
      setSelectedTable(tableName); // Set the selected table
      setContextMenuVisible_2(true);

    }
  };

const handleClick = (e) => {
  if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
    setContextMenuVisible(false);
    setContextMenuVisible_2(false);

  }
};

useEffect(() => {
  document.addEventListener('click', handleClick);

  return () => {
    document.removeEventListener('click', handleClick);
  };
}, []);



  const openFileUploadModal = () => {
    setFileUploadModalVisible(true);
  };

  const closeFileUploadModal = () => {
    setFileUploadModalVisible(false);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    console.log('Selected File:', file);
    setSelectedFile(file);
    //setIsFileDropped(true);
  };

  const handleFileUpload = async () => {
      if (!selectedDatabase || !selectedFile) {
        console.error('Please select a database and a file.');
        return;
      }

      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        const response = await fetch(`http://localhost:8082/api/upload-file/${selectedDatabase}`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.text();
          console.log(result);
          closeFileUploadModal();
        } else {
          console.error('Failed to upload file.');
        }
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    };

  const handleContextMenuOption = (option, tableName) => {

    setSelectedOption(option);
    setContextMenuVisible(false);



    if (option === 'uploadFile') {
      openFileUploadModal();
    } else if (option === 'showTables') {
      setDisplayTables(true);
    } else if (option === 'displayTableData') {
      // Set the visibility of the "Display Table Data" option to true

     // setSelectedTableName(tableName);
      //fetchTableData(selectedDatabase, tableName,page, pageSize); //!!!!!!!!!!!!
      //new
      // handleTableSelect(selectedDatabase,selectedTable);
      // fetchDistinctColumnValues();
      // handleValueSelect();
       //new
    }

  };


  const handleContextMenuOption_2 = (option, tableName) => {

      setSelectedOption(option);
      setContextMenuVisible_2(false);

     if (option === 'displayTableData') {
        // Set the visibility of the "Display Table Data" option to true

        //setSelectedTableName(tableName);
      // fetchTableData(selectedDatabase, tableName,page, pageSize); //!!!!!!
         //new
              // handleTableSelect(selectedDatabase,tableName);
              // fetchDistinctColumnValues();
              // handleValueSelect();
               //new

      }

    };



const fetchTableData = async() => {
 setIsFiltering(false);
    try {
      const response = await fetch(
        `http://localhost:8082/api/get-table-data/${selectedDatabase}/${selectedTable}/${page}/${pageSize}`
      );

      if ( response.ok) {
        const data = await response.json();

        setSelectedTableData(data);
        // Calculate total pages based on the total records and page size
                const totalRecords = await fetchTotalRecords();
                // Log the value to console for debugging
                console.log('Total Records:', totalRecords);

                const totalTablePages = isNaN(totalRecords) ? 0 :Math.ceil(totalRecords / pageSize);
                //const  totalTablePages = !isFiltering ? totalRecords : totalFilteredRecords ;

                console.log(`Pages 1 of ${totalTablePages}`);
                setTotalPages(totalTablePages);
      } else {
        console.error('Failed to fetch paginated table data.');
      }
    } catch (error) {
      console.error('Error while fetching paginated table data:', error);
    }
  };



// Update handlePageChange
const handlePageChange = async (newPage) => {
   if (newPage >= 1 && newPage <= totalPages) {
     const filters = {};

     if (isFiltering) {
       for (const column of columns) {
         if (selectedValues[column]) {
           filters[column] = selectedValues[column];
         }
       }

       console.log('Filters:', filters);
       console.log('New Page:', newPage);
       console.log('Is Filtering:', isFiltering);

       await fetchFilteredData(filters, newPage);
       setIsFiltering(true);
     } else {
       setFilteredPage(newPage);

       // Log values for debugging
       console.log('Fetching unfiltered data for page:', newPage);

       await fetchTableData(newPage, pageSize);

       setIsFiltering(false);
     }

     setPage(newPage);
   }
 };


const handlePageSizeChange = (pageSize) => {
  setPageSize(pageSize);
  setPage(1); // Reset to the first page when changing page size
  // Reset filtered page as well
  setFilteredPage(1);
};


const fetchTotalRecords = async () => {
  try {
    const response = await fetch(`http://localhost:8082/api/get-total-records/${selectedDatabase}/${selectedTable}`);
    if (response.ok) {
      const result = await response.json();
      console.log('Total Records:', result.totalRecords);
      return result.totalRecords;
    } else {
      console.error('Failed to fetch total records.');
    }
  } catch (error) {
    console.error('Error fetching total records:', error);
  }
};

const fetchTotalFilteredRecords = async (filters, page) => {
  try {
    const response = await fetch(`http://localhost:8082/api/get-total-filtered-records/${selectedDatabase}/${selectedTable}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(filters),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Response from server:', result); // Log the entire response for inspection
      if (result.totalFilteredRecords !== undefined) {
        console.log('Total Filtered Records:', result.totalFilteredRecords);
        return result.totalFilteredRecords;
      } else {
        console.error('Response is missing expected property: totalFilteredRecords');
      }
    } else {
      console.error('Failed to fetch total filtered records. Status:', response.status);
    }
  } catch (error) {
    console.error('Error fetching total filtered records:', error);
  }
};



  //added

  //new
const fetchDistinctColumnValues = async (columnName) => {
  console.log("Selected Database:", selectedDatabase);
  console.log("Table Name:", selectedTable);
  console.log("Column Name:", columnName);

  try {
    const response = await fetch(`http://localhost:8082/api/get-distinct-column-values/${selectedDatabase}/${selectedTable}/${columnName}`);

    if (response.ok) {
      const values = await response.json();
      console.log('Distinct Values:', values);

      return new Promise((resolve) => {
        setDistinctValues((prev) => ({ ...prev, [columnName]: values }));
        resolve();
      });
    } else {
      console.error('Failed to fetch distinct column values.');
      return Promise.reject('Failed to fetch distinct column values.');
    }
  } catch (error) {
    console.error('Error fetching distinct column values:', error);
    return Promise.reject(error);
  }
};

    // Function to handle the selection of a table
    const handleTableSelect = async () => {
      try {
        // Fetch the columns for the selected table
        const response = await fetch(`http://localhost:8082/api/get-table-columns/${selectedDatabase}/${selectedTable}`);

        if (response.ok) {
          const tableColumns = await response.json();
          console.log('Table Columns:', tableColumns);

          // Set the columns for the selected table
          setColumns(tableColumns);

          // Clear existing distinct values and table data
          setDistinctValues({});
          setTableData([]);

          // Fetch distinct values for each column
          tableColumns.forEach((column) => {
            fetchDistinctColumnValues(column);
          });
        } else {
          console.error('Failed to fetch table columns.');
        }
      } catch (error) {
        console.error('Error fetching table columns:', error);
      }
    };


    // Function to handle the selection of values from dropdowns
   const handleValueSelect = (columnName, selectedValue) => {
     setSelectedValues((prevValues) => ({
       ...prevValues,
       [columnName]: selectedValue,
     }));
   };

  const handleFilterButtonClick = async () => {
    setIsFiltering(true);

    // Prepare the filters based on the selected values
    const filters = {};
    for (const column of columns) {
      if (inputValues[column]) {
        filters[column] = inputValues[column];
      } else if (selectedValues[column]) {
        filters[column] = selectedValues[column];
      }
    }

    console.log("filters are:", filters);

    // Call the API to get filtered data with pagination
    await fetchFilteredData(filters, page);
  };





const fetchFilteredData = async (filters, page) => {
  setIsFiltering(true);

  try {
    console.log('Fetching filtered data. Filters:', filters);
    console.log('Page:', page);

    const response = await fetch(`http://localhost:8082/api/filter-table/${selectedDatabase}/${selectedTable}/${page}/${pageSize}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(filters),
    });

    if (response.ok) {
      const filteredData = await response.json();
      console.log('Filtered Data:', filteredData);

      setFilteredTableData(filteredData);

      const totalFilteredRecords = await fetchTotalFilteredRecords(filters);
      const totalFilteredPages = isNaN(totalFilteredRecords) ? 0 : Math.ceil(totalFilteredRecords / pageSize);
      console.log('Total Filtered Pages:', totalFilteredPages);

      setTotalFilteredPages(totalFilteredPages);
    } else {
      console.error('Failed to fetch filtered data.');
    }
  } catch (error) {
    console.error('Error fetching filtered data:', error);
  }
};


    const handleTypeAheadInputChange = async (columnName, value) => {
        setInputValues((prevInputValues) => ({
          ...prevInputValues,
          [columnName]: value,
        }));

        if (value.length > 2) {
          const filteredValues = distinctValues[columnName].filter((v) =>
            v.toLowerCase().includes(value.toLowerCase())
          );
          setFilteredValues((prevFilteredValues) => ({
            ...prevFilteredValues,
            [columnName]: filteredValues,
          }));
          setIsListOpen((prevIsListOpen) => ({
            ...prevIsListOpen,
            [columnName]: true,
          }));
        } else {
          setFilteredValues((prevFilteredValues) => ({
            ...prevFilteredValues,
            [columnName]: [],
          }));
          setIsListOpen((prevIsListOpen) => ({
            ...prevIsListOpen,
            [columnName]: false,
          }));
        }
      };

      const handleTypeAheadSelect = (columnName, selectedValue) => {
        setInputValues((prevInputValues) => ({
          ...prevInputValues,
          [columnName]: selectedValue,
        }));
        setIsListOpen((prevIsListOpen) => ({
          ...prevIsListOpen,
          [columnName]: false,
        }));
      };
  //new

  const handleDatabaseChange = (e) => {
    setSelectedDatabase(e.target.value);
    setSelectedOption(null);
    setContextMenuVisible(false);

    // Close the open table data when choosing a different database
    setSelectedTable(null);
    setSelectedTableData([]);

    if (e.target.value) {
      fetch(`http://localhost:8082/api/tables-in-database/${e.target.value}`)
        .then((response) => {
          if (response.status === 200) {
            return response.json();
          } else {
            throw new Error('Failed to retrieve tables');
          }
        })
        .then((data) => {
          setTablesInDatabase(data);
          setTableOrder(data);
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      setTablesInDatabase([]);
      setDisplayTables(false);
    }
  };

const handleCloseTableData = () => {
  setSelectedTable(null);
  setSelectedTableData([]);
  setFilteredTableData([]);
  setIsFiltering(false); // Reset the filtering state
};



  return (
    <div className="container">
      <h1>Welcome</h1>
      <h2>Create a New Database</h2>

      <input
        type="text"
        placeholder="Database Name"
        value={dbName}
        onChange={(e) => setDbName(e.target.value)}
      />
      <button className="create-button" onClick={handleCreateDatabase}>
        Create Database
      </button>

      <div>
        <h2>Your Databases</h2>
        <select
          className="database-select"
          onChange={handleDatabaseChange}
          value={selectedDatabase}
          onContextMenu={handleContextMenu}
        >
          <option value="">Select a Database</option>
          {databases.map((database, index) => (
            <option key={index} value={database}>
              {database}
            </option>
          ))}
        </select>
      </div>

      <div>
        {contextMenuVisible && (
          <div ref={contextMenuRef} className="context-menu" style={{ top: contextMenuPosition.top, left: contextMenuPosition.left }}>
            <div onClick={openFileUploadModal}>Upload File to Database</div>
            <div onClick={() => setDisplayTables(true)}>Display Tables</div>

          </div>
        )}

     {contextMenuVisible_2 && (
          <div ref={contextMenuRef} className="context-menu" style={{ top: contextMenuPosition.top, left: contextMenuPosition.left }}>
           // <div onClick={() => fetchTableData(selectedDatabase, selectedTable,page, pageSize)}>Display Table Data</div>
          </div>
        )}



        {displayTables && selectedDatabase && (
          <div>
            <h2>Tables in: {selectedDatabase} Database</h2>
            <div className="table-list">
              {tableOrder.map((table, index) => (
                <div
                  key={table}
                  className={`custom-table ${selectedTable === table ? 'selected' : ''}`}
                  onClick={() => setSelectedTable(table)}
                  onContextMenu={(e) => handleContextMenu_2(e, table)}
                >
                  {table}
                </div>
              ))}


            </div>
          </div>
        )}
        {(isFiltering ? (filteredTableData && filteredTableData.length > 0) : (selectedTableData && selectedTableData.length > 0)) && (

             <div>
                       <div id="filters">
                            {columns.map((column, index) => (
                              <div key={index}>
                                <label>{column}</label>

                                {distinctValues[column] && distinctValues[column].length > 100 ? (
                                  <div>
                                    <input
                                      type="text"
                                      placeholder={`Type to search ${column}`}
                                      value={inputValues[column] || ''}
                                      onChange={(e) => handleTypeAheadInputChange(column, e.target.value)}

                                    />
                                  {isListOpen[column] && (
                                      <ul>
                                        {filteredValues[column] &&
                                          filteredValues[column].map((value, valueIndex) => (
                                            <li key={valueIndex} onClick={() => handleTypeAheadSelect(column, value)}>
                                              {value}
                                            </li>
                                          ))}
                                      </ul>
                                    )}
                                  </div>
                                ) : (
                                  <select onChange={(e) => handleValueSelect(column, e.target.value)}>
                                    <option value="">Select {column}</option>
                                    {distinctValues[column] &&
                                      distinctValues[column].map((value, valueIndex) => (
                                        <option key={valueIndex} value={value}>
                                          {value}
                                        </option>
                                      ))}
                                  </select>
                                )}
                              </div>
                            ))}
                            <button onClick={handleFilterButtonClick}>Filter</button>
                        </div>




                <h2>
                  Table Data
                  {selectedTable && (
                    <span className="close-button" onClick={() => handleCloseTableData()}>Close
                      &#x2715;
                    </span>
                  )}
                </h2>

           <table>
             <thead>
               <tr>
                 {(isFiltering ? filteredTableData?.[0] : selectedTableData?.[0]) &&
                   Object.keys(isFiltering ? filteredTableData[0] : selectedTableData[0]).map((column, index) => (
                     <th key={index}>{column}</th>
                   ))}
               </tr>
             </thead>
             <tbody>
               {isFiltering
                 ? (filteredTableData && filteredTableData.length > 0
                     ? filteredTableData.map((row, rowIndex) => (
                         <tr key={rowIndex}>
                           {Object.values(row).map((value, columnIndex) => (
                             <td key={columnIndex}>{value}</td>
                           ))}
                         </tr>
                       ))
                     : <tr><td colSpan="3">No data found</td></tr>)
                 : (selectedTableData && selectedTableData.length > 0
                     ? selectedTableData.map((row, rowIndex) => (
                         <tr key={rowIndex}>
                           {Object.values(row).map((value, columnIndex) => (
                             <td key={columnIndex}>{value}</td>
                           ))}
                         </tr>
                       ))
                     : <tr><td colSpan="3">No data found</td></tr>)}
             </tbody>
           </table>


          <div className="pagination-controls">
            <button onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
                Previous
              </button>
              <span>Page {page} of {isFiltering ? totalFilteredPages : totalPages}</span>
              <button onClick={() => handlePageChange(page + 1)} disabled={page === (isFiltering ? totalFilteredPages : totalPages)}>
                Next
              </button>

            <span>Page Size:</span>
            <select value={pageSize} onChange={(e) => handlePageSizeChange(Number(e.target.value))}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>


          </div>
        )}

        {fileUploadModalVisible && (
          <div className="modal">
            <div className="modal-content">
              <span className="close" onClick={closeFileUploadModal}>&times;</span>
              <h2>Upload File to Database</h2>
              {isFileDropped && (
                <div>
                  <h3>Selected File:</h3>
                  <p>{selectedFile.name}</p>
                </div>
              )}

              <div className="drop-area" onDragOver={handleDragOver} onDrop={handleDrop}>
                <p className="drop-text">
                  {selectedFile ? selectedFile.name : "Drag & Drop files here or click to browse"}
                </p>
                <input
                  type="file"
                  id="fileInput"
                  accept=".csv, .xlsx, .json"
                  onChange={handleFileInputChange}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
              </div>

              <button className="create-button" onClick={handleFileUpload}>Upload File</button>
              <button className="create-button" onClick={clearSelectedFile}>Clear File</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );


}

export default CreateSchemaForm;
