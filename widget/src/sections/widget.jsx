import React from "react";

const Widget = ({ customer_id }) => {
  return (
    <>
      <div style={{height:"99vh"}}>
        <iframe
          name="myiFrame"
          width="100%"
          height="100%"
          src={`https://e04e1f45-ddfa-4cfd-aa2c-825ae20bc005-00-4q1rcyndehbs.kirk.replit.dev/?customer_id=${customer_id}`}
          scrolling="no"
          marginwidth="0"
          marginheight="0"
          style={{ border: "0px none #ffffff" }}
        ></iframe>
      </div>
    </>
  );
};

export default Widget;
