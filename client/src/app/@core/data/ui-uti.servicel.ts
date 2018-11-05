import { Injectable } from "@angular/core";

@Injectable()
export class UIUtilService {

  patchNbSelect(nbSelect) {
    if (nbSelect.options._results.length > 1) {
        const template = nbSelect.options._results[0];
        const observer = template.selectionChange.observers[0];
        nbSelect.options._results.forEach(element => {
            element.selectionChange.observers.push(observer);
        });

        return true;
    }
    return false;
}

}
