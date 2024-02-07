import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
    standalone: true,
    name: "sort"
})
export class SortPipe  implements PipeTransform {
    transform<T>(array: T, field: string, collection: {}|null = null): T {
        if (!Array.isArray(array)) {
            return array;
        }
        array.sort((a: any, b: any) => {
            let aValue = this.getValue(a, field);
            let bValue = this.getValue(b, field);
            if (aValue < bValue) {
                return -1;
            } else if (aValue > bValue) {
                return 1;
            } else {
                return 0;
            }
        });
        return array;
    }

    getValue(object:any, field:string): any {
        let fieldList = field.split('.');
        for (let field of fieldList) {
            if (object[field]) {
                object = object[field];
            } else {
                return null;
            }
        }
        if (typeof object === 'string') {
            object = object.toLowerCase();
        }
        return object;
    }
}