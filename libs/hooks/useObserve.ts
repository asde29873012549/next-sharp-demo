type ObservedObject<T> = {
	[P in keyof T]: T[P] extends object ? ObservedObject<T[P]> : T[P];
  };
  
  function useObserve<T extends object>(target: T): ObservedObject<T> {
	return new Proxy(target, {
	  set(target, property, value, receiver): boolean {
		const oldValue = Reflect.get(target, property, receiver);
		const isSuccess = Reflect.set(target, property, value, receiver);
		if (isSuccess) {
		  console.log(`Value of ${String(property)} has changed from ${oldValue} to ${value}`);
		} else {
		  console.log(`Value of ${String(property)} has not changed`);
		}
		return isSuccess;
	  },
	  get(target, property, receiver) {
		const value = Reflect.get(target, property, receiver);
		console.log(`Get property ${String(property)}, type is ${typeof value}`);
		if (typeof value === "object" && value !== null) {
		  return useObserve(value);
		}
		return value;
	  },
	  deleteProperty(target, property): boolean {
		const isSuccess = Reflect.deleteProperty(target, property);
		if (isSuccess) {
		  console.log(`Property ${String(property)} has been deleted`);
		} else {
		  console.log(`Property ${String(property)} has not been deleted`);
		}
		return isSuccess;
	  },
	  apply(target: Function, thisArg: any, args: any[]): any {
		console.log(`${thisArg} called function ${target.name}, arguments are ${args}`);
		return Reflect.apply(target, thisArg, args);
	  }
	});
  }
  

export default useObserve;