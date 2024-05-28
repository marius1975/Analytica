import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import React, { useState, useEffect, useRef} from 'react';
import { useFilter } from './FilterContext';
import Chart from 'chart.js/auto';
import axios from 'axios';
import './CreateSchemaForm.css';
import './LoginForm.js';
import './MainPage.js';

function CreateSchemaForm({ isLoggedIn, onCreateSchema,loggedInUsername, onLogoff}){
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTablePages, setTotalTablePages] = useState(1);
  const [filteredPage, setFilteredPage] = useState(1);
  const[totalFilteredRecords, setTotalFilteredRecords] = useState(0);
  const [totalFilteredPages, setTotalFilteredPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0); // Add a state for total pages
  const [distinctValues, setDistinctValues] = useState({}); // State to store distinct column values
  const [selectedValues, setSelectedValues] = useState({}); // State to store selected values for filtering
  const [columns, setColumns] = useState([]);
  const [columnName, setColumnName] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputValues, setInputValues] = useState({});
  const [filteredValues, setFilteredValues] = useState({});
  const [isListOpen, setIsListOpen] = useState({});
  const [isFiltering, setIsFiltering] = useState(false);
  const {filters, setFilter } = useFilter();
  const [chartRendered, setChartRendered] = useState(false);
  const [columnPercentages, setColumnPercentages] = useState({});
  const [selectedColumn, setSelectedColumn] = useState('');
    const [columnData, setColumnData] = useState([]);
    const [distinctGroupsCount, setDistinctGroupsCount] = useState({});
    const [distinctCounts, setDistinctCounts] = useState({});
    const [columnCounts, setColumnCounts] = useState({});
  const canvasRef = useRef(null);

useEffect(() => {
    if (filteredTableData) {
      const counts = {};

      // Iterate over each column in the filtered data
      Object.keys(filteredTableData[0] || {}).forEach(column => {
        // Count the occurrences of each value in the column
        const columnValues = filteredTableData.map(row => row[column]);
        const valueCounts = {};

        columnValues.forEach(value => {
          valueCounts[value] = (valueCounts[value] || 0) + 1;
        });

        counts[column] = valueCounts;
      });

      setColumnCounts(counts);
    }
  }, [filteredTableData]);




useEffect(() => {
  if (isLoggedIn && selectedDatabase && selectedTable && !chartRendered) {
    fetchFilteredDataWithPercentage(filters, page);

  }
}, [isLoggedIn, selectedDatabase, selectedTable, chartRendered, filters, page]);


const fetchFilteredDataWithPercentage = async (filters, page) => {
  setIsFiltering(true);

  try {
    // Fetch the total number of records
    const totalRecords = await fetchTotalRecords();

    // Fetch the filtered data
    const response = await fetch(`http://localhost:8082/api/filter-table/${selectedDatabase}/${selectedTable}/${page}/${pageSize}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(filters),
    });

    if (response.ok) {
      const filteredData = await response.json();

      const newColumnPercentages = {};

      Object.keys(filteredData[0]).forEach(column => {
        const uniqueValues = [...new Set(filteredData.map(row => row[column]))];

        const percentages = {};
        uniqueValues.forEach(value => {
          const filteredRowsWithValue = filteredData.filter(row => row[column] === value);
          const percentage = (filteredRowsWithValue.length / totalRecords) * 100;
          percentages[value] = percentage;
        });

        newColumnPercentages[column] = percentages;
      });

      setFilteredTableData(filteredData);
      setColumnPercentages(newColumnPercentages);

      const totalFilteredRecords = await fetchTotalFilteredRecords(filters);
      const percentageFiltered = (totalFilteredRecords / totalRecords) * 100;

      const totalFilteredPages = isNaN(totalFilteredRecords) ? 0 : Math.ceil(totalFilteredRecords / pageSize);
      setTotalFilteredPages(totalFilteredPages);

      console.log('Total Records:', totalRecords);
      console.log('Percentage of Filtered Records:', percentageFiltered);

      setChartRendered(true);
    } else {
      console.error('Failed to fetch filtered data.');
    }
  } catch (error) {
    console.error('Error fetching filtered data:', error);
  }
};

let myChart = null; // Declare a variable to hold the chart instance

//renders the pie chart 
useEffect(() => {

const renderPieChart = (labels, columnPercentages) => {
  const ctx = canvasRef.current?.getContext('2d');

  // Check if ctx is null before proceeding
  if (!ctx) {
    console.error('Canvas context is null.');
    return;
  }

  // Check if a chart instance already exists
  if (myChart) {
    // Destroy the existing chart
    myChart.destroy();
  }

  // Remove "username" label if it exists
  const filteredLabels = labels.filter(label => label !== "username");

  // Extract data only for labels that have both name and percentage
  const data = filteredLabels.map(label => {
    const percentages = columnPercentages[label];
    const hasPercentage = Object.values(percentages).some(percentage => percentage !== 0);
    return hasPercentage ? { label, percentages } : null;
  }).filter(Boolean);

  // Create arrays for labels and their corresponding percentages
  const filteredLabelsData = data.map(entry => entry.label);
  const percentagesData = data.map(entry => Object.values(entry.percentages)[0]);

  // Create a new chart instance
  myChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: filteredLabelsData,
      datasets: [
        {
          data: percentagesData,
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)',
            'rgba(255, 159, 64, 0.5)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
          ],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      width: 300,
      height: 300,
      tooltips: {
        callbacks: {
          label: (tooltipItem, data) => {
            const label = data.labels[tooltipItem.index];
            const value = data.datasets[0].data[tooltipItem.index];
            return `${label}: ${value}%`;
          },
        },
      },

    },
  });
};


  // Existing useEffect logic
  if (chartRendered && filteredTableData) {
    renderPieChart(Object.keys(columnPercentages), columnPercentages);
  }

  // Cleanup function
  return () => {
    if (myChart) {
      myChart.destroy(); // Destroy the chart instance when the component unmounts
    }
  };
}, [chartRendered, columnPercentages, filteredTableData]);

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

  //access the users databases 
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

// delete a database from the list
const handleDeleteDatabase = async (dbNameToDelete) => {
  // Prompt the user for confirmation
  const confirmDelete = window.confirm(`Are you sure you want to delete the database '${selectedDatabase}'?`);

  if (!confirmDelete) {
    // User cancelled, do nothing
    return;
  }

  try {
    const response = await fetch(`http://localhost:8082/api/delete-database/${selectedDatabase}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      console.log('Database deleted successfully:', selectedDatabase);
      // Update UI to reflect the deleted database
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
      // For example, remove it from the list of databases
    } else {
      console.error('Failed to delete the database');
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

//upload files to database
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

      // Fetch the updated list of tables after successful file upload
      fetch(`http://localhost:8082/api/tables-in-database/${selectedDatabase}`)
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

      // Fetch filtered data based on the current filter values and the new page number
      await fetchFilteredData(filters, newPage);

      setIsFiltering(true);
    } else {
      // Fetch unfiltered data for the new page
      setFilteredPage(newPage);
      console.log('Fetching unfiltered data for page:', newPage);
      await fetchTableData(newPage, pageSize);
      setIsFiltering(false);
    }

    // Update the page state
    setPage(newPage);

  }
};



//get the table data
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




// change the page size
const handlePageSizeChange = (pageSize) => {
  setPageSize(pageSize);
  setPage(1); // Reset to the first page when changing page size
  // Reset filtered page as well
  setFilteredPage(1);
};

//get the total number of records available in a file
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

  //get the total number of the filtered records from a file
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

  //get the distinct values from a column
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

     // Fetch filtered data based on the selected value
                   const filters = { [columnName]: selectedValue };
                    fetchFilteredData(filters, page);
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
    await fetchFilteredDataWithPercentage(filters, page);

  };


// get the filtered table data
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
      body: JSON.stringify(filters), // Include filters in the request body
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


// handles the type ahead functionality
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

// handles the type ahaead selection
const handleTypeAheadSelect = async (columnName, selectedValue) => {
  setInputValues((prevInputValues) => ({
    ...prevInputValues,
    [columnName]: selectedValue,
  }));
  setIsListOpen((prevIsListOpen) => ({
    ...prevIsListOpen,
    [columnName]: false,
  }));

  // Fetch filtered data based on the selected value
  const filters = { [columnName]: selectedValue };
  await fetchFilteredData(filters, page);

};


//handles the change of the data base
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

  //handles the closing option of a table
const handleCloseTableData = () => {
  setSelectedTable(null);
  setSelectedTableData([]);
  setFilteredTableData([]);
  setIsFiltering(false); // Reset the filtering state
  setChartRendered(false);
};

//handles the delete table option 
  const handleDeleteTable = (e, tableName) => {
      fetch(`http://localhost:8082/api/delete-table/${selectedDatabase}/${selectedTable}`, {
          method: 'DELETE',
      })
      .then((response) => {
          if (response.status === 200) {
              console.log(`Table ${tableName} deleted successfully.`);

              // After successful deletion, fetch the updated list of tables
              fetch(`http://localhost:8082/api/tables-in-database/${selectedDatabase}`)
              .then((response) => {
                  if (response.status === 200) {
                      return response.json();
                  } else {
                      throw new Error('Failed to retrieve tables after deletion.');
                  }
              })
              .then((data) => {
                  // Update the list of tables in the state
                  setTableOrder(data);
                  setSelectedTable(null);
                    setSelectedTableData([]);
                    setFilteredTableData([]);
                    setIsFiltering(false); // Reset the filtering state
                    setChartRendered(false);
              })
              .catch((error) => {
                  console.error('Error fetching tables after deletion:', error);
              });
          } else {
              throw new Error('Failed to delete table.');
          }
      })
      .catch((error) => {
          console.error('Error deleting table:', error);
      });
  };

  //handles the excel format download of a file
const handleDownload = async () => {
    try {
        const response = await fetch(`http://localhost:8082/api/download-table-data/${selectedDatabase}/${selectedTable}/${page}/${pageSize}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(filters), // Include filters in the request body
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(new Blob([blob]));

            // Prompt user to choose download location
            const a = document.createElement('a');
            a.href = url;
            a.setAttribute('download', `${selectedTable}.xlsx`);
            a.setAttribute('target', '_blank'); // Open in new tab
            a.click();
        } else {
            console.error('Failed to download table data.');
        }
    } catch (error) {
        console.error('Error downloading table data:', error);
    }
};

  //handles the log off option
const handleLogoff = async () => {
    try {
        const response = await fetch('http://localhost:8082/api/logoff', {
            method: 'POST',
        });

        if (response.ok) {
            console.log('Logoff successful');
            // Call the parent component's callback to notify of successful logoff
            onLogoff();
        } else {
            console.error('Logoff failed');
        }
    } catch (error) {
        console.error(error);
    }
};

return (
  <div className="container">
      {isLoggedIn ? (
              <h1></h1>
            ) : (
              <h1>Please log in to access this feature</h1>
            )}

<div id="column_counts_container">

  {Object.keys(columnCounts).map(column =>
    (column !== 'username' && (
      <div key={column}>
        <h3>{column}</h3>
        <ul>
          {Object.keys(columnCounts[column]).map(value => (
            <li key={value}>{value}: {columnCounts[column][value]}</li>
          ))}
        </ul>
      </div>
    ))
  )}
</div>
        <div className="charts-container">
                <div id="pieChart_container">
                  <canvas id="pieChart" ref={canvasRef} width="300" height="300"></canvas>
                </div>
      </div>
      <button className="logoff-button" onClick={handleLogoff}>
        Logoff
      </button>
      <h2>Create Database</h2>
      <div className="create_db_container">
        <input
          id="create_db_input"
          type="text"
          placeholder="Database Name"
          value={dbName}
          onChange={(e) => setDbName(e.target.value)}
        />
        <button className="create-button" onClick={handleCreateDatabase}>
          Create Database
        </button>
      </div>

      <div>
        <h2>Databases</h2>
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
    {contextMenuVisible && (
      <div
        ref={contextMenuRef}
        className="context-menu"
        style={{ top: contextMenuPosition.top, left: contextMenuPosition.left }}
      >
        <div onClick={openFileUploadModal}>Upload File to Database</div>
        <div onClick={() => setDisplayTables(true)}>Display Tables</div>
        <div  onClick={handleDeleteDatabase}>Delete Database</div>
      </div>
    )}
{displayTables && selectedDatabase && (
  <div>
    <h2>List of tables</h2>
    <div className="table-list">
      <select
        className="table-select"
        onChange={(e) => setSelectedTable(e.target.value)}
        value={selectedTable}
        onContextMenu={(e) => handleContextMenu(e)}
      >
        <option value="">Select a Table</option>
        {tableOrder.map((table, index) => (
          <option key={table} value={table}>
            {table}
          </option>
        ))}
      </select>
    </div>
  </div>
)}


    {(isFiltering ? (filteredTableData && filteredTableData.length > 0) : (selectedTableData && selectedTableData.length > 0)) && (
      <div>
        <div id="filters">
          {(isFiltering ? filteredTableData?.[0] : selectedTableData?.[0]) &&
            Object.keys(isFiltering ? filteredTableData[0] : selectedTableData[0]).map((column, index) => (
              <div key={index}>
                <label>{column}</label>
                {distinctValues[column] && distinctValues[column].length > 1000 ? (
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
            <span className="close-button" onClick={() => handleCloseTableData()}>
              Close &#x2715;
            </span>
          )}
        </h2>
{selectedTable && (
  <button className="delete-button" onClick={handleDeleteTable}>
    Delete Table
  </button>

)}
    <button onClick={handleDownload}>
               Download Excel
           </button>
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
);

}

export default CreateSchemaForm;


