

  
    const source = new EventSource('/impressionsStream');

      source.addEventListener('message', message => {
        console.log('Got Impressions');
        // Display the event data in the myTable table
          document.querySelector('#myTable').innerHTML = message.data;
      });
