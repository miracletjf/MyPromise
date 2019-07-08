import MP from "./MyPromise";

const mm = () => {
  return new MP((resolve, reject) => {
    setTimeout(() => {
      resolve("success");
    }, 1000);
  });
};

mm()
  .then(res => {
    console.log(res);
    return "ssss";
  })
  .then(res => {
    console.log(res);
  });
